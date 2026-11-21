import crypto from "node:crypto";
import { SEED_ISSUES } from "@/lib/data/seedIssues";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getSafePublicReporterName } from "@/lib/security/auth";
import { computeDashboardStats } from "@/lib/utils";
import type { ListIssuesQuery } from "@/lib/validation/issueSchemas";
import {
  COMPLETION_VERDICTS,
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  MUNICIPAL_DEPARTMENTS,
  type AIAnalysis,
  type CompletionReport,
  type CompletionVerdict,
  type CompletionVerification,
  type Issue,
  type IssueCategory,
  type IssueLocation,
  type IssuePriority,
  type IssueStatus,
  type MunicipalDepartment,
  type PaginatedIssuesResponse,
  type StatusHistoryEntry,
} from "@/types/issue";

const ISSUES_COLLECTION = "issues";

/**
 * In-memory store initialized with SEED_ISSUES so local dev, Playwright E2E,
 * and Vitest suites run seamlessly even when Firestore/ADC is not configured.
 */
const globalStore = globalThis as typeof globalThis & {
  __civicResolveMemoryIssues?: Issue[];
};

function getMemoryStore(): Issue[] {
  if (!globalStore.__civicResolveMemoryIssues) {
    globalStore.__civicResolveMemoryIssues = structuredClone(SEED_ISSUES);
  }
  return globalStore.__civicResolveMemoryIssues;
}

/** Resets the in-memory fallback store to initial seed data (for deterministic tests). */
export function resetInMemoryIssuesStore(): void {
  globalStore.__civicResolveMemoryIssues = structuredClone(SEED_ISSUES);
}

function normalizeStatus(raw: unknown): IssueStatus {
  return typeof raw === "string" &&
    (ISSUE_STATUSES as readonly string[]).includes(raw)
    ? (raw as IssueStatus)
    : "Reported";
}

function normalizePriority(raw: unknown): IssuePriority {
  return typeof raw === "string" &&
    (ISSUE_PRIORITIES as readonly string[]).includes(raw)
    ? (raw as IssuePriority)
    : "Medium";
}

function normalizeCategory(raw: unknown): IssueCategory {
  return typeof raw === "string" &&
    (ISSUE_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as IssueCategory)
    : "Road Infrastructure";
}

function normalizeDepartment(raw: unknown): MunicipalDepartment {
  return typeof raw === "string" &&
    (MUNICIPAL_DEPARTMENTS as readonly string[]).includes(raw)
    ? (raw as MunicipalDepartment)
    : "Public Works — Road Maintenance";
}

function normalizeVerdict(raw: unknown): CompletionVerdict {
  return typeof raw === "string" &&
    (COMPLETION_VERDICTS as readonly string[]).includes(raw)
    ? (raw as CompletionVerdict)
    : "Needs Re-Inspection";
}

/**
 * Normalizes Firestore documents (including legacy shape fields or unknown enum values)
 * and strips any raw email addresses before returning to clients.
 */
export function sanitizePublicIssue(
  raw: Partial<Issue> & { reporterId?: string | null },
  fallbackId?: string,
): Issue {
  const id = raw.id ?? fallbackId ?? "cr-unknown";
  const loc = (raw.location ?? {}) as Partial<IssueLocation>;
  const state = (raw.state || loc.state || "Tamil Nadu").trim();
  const city = (raw.city || loc.city || "Coimbatore").trim();

  const reporterName = getSafePublicReporterName(
    raw.reporterName,
    raw.reporterName?.includes("@") ? raw.reporterName : null,
  );

  const upvotedBy = Array.isArray(raw.upvotedBy)
    ? raw.upvotedBy.filter((u): u is string => typeof u === "string")
    : [];

  const statusHistory: StatusHistoryEntry[] = Array.isArray(raw.statusHistory)
    ? raw.statusHistory.map((entry) => ({
        status: normalizeStatus(entry?.status),
        timestamp: entry?.timestamp ?? new Date().toISOString(),
        note: typeof entry?.note === "string" ? entry.note : "",
        updatedBy:
          typeof entry?.updatedBy === "string" ? entry.updatedBy : "System",
      }))
    : [];

  const completionReport: CompletionReport | null = raw.completionReport
    ? {
        ...raw.completionReport,
        aiVerification: {
          ...raw.completionReport.aiVerification,
          verdict: normalizeVerdict(
            raw.completionReport.aiVerification?.verdict,
          ),
        },
      }
    : null;

  return {
    id,
    referenceCode: raw.referenceCode ?? id.toUpperCase(),
    title: raw.title ?? "Civic Issue Report",
    description: raw.description ?? "",
    category: normalizeCategory(raw.category),
    status: normalizeStatus(raw.status),
    priority: normalizePriority(raw.priority),
    urgencyScore: raw.urgencyScore ?? 50,
    department: normalizeDepartment(raw.department),
    state,
    city,
    location: {
      address: loc.address ?? "",
      city,
      state,
      district: loc.district ?? "",
      lat: typeof loc.lat === "number" ? loc.lat : 11.0168,
      lng: typeof loc.lng === "number" ? loc.lng : 76.9558,
    },
    photoUrl: raw.photoUrl ?? null,
    photoAltText: raw.photoAltText ?? raw.title ?? "Civic issue evidence photo",
    upvotes: typeof raw.upvotes === "number" ? raw.upvotes : upvotedBy.length,
    upvotedBy,
    reporterUid: raw.reporterUid ?? raw.reporterId ?? null,
    reporterName,
    resolutionNote: raw.resolutionNote ?? null,
    completionReport,
    aiAnalysis: raw.aiAnalysis!,
    statusHistory,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

function applyScopeFilters(
  issues: Issue[],
  query: ListIssuesQuery,
  currentUserUid?: string | null,
): Issue[] {
  return issues.filter((issue) => {
    if (query.mine) {
      if (!currentUserUid || issue.reporterUid !== currentUserUid) {
        return false;
      }
    }
    if (query.state && query.state !== "All" && issue.state !== query.state) {
      return false;
    }
    if (query.city && query.city !== "All" && issue.city !== query.city) {
      return false;
    }
    return true;
  });
}

function applyAttributeFiltersAndSort(
  issues: Issue[],
  query: ListIssuesQuery,
): Issue[] {
  const searchLower = query.search.trim().toLowerCase();

  const filtered = issues.filter((issue) => {
    if (query.status !== "All" && issue.status !== query.status) return false;
    if (query.priority !== "All" && issue.priority !== query.priority)
      return false;
    if (query.category !== "All" && issue.category !== query.category)
      return false;
    if (query.department !== "All" && issue.department !== query.department)
      return false;

    if (searchLower) {
      const haystack = [
        issue.referenceCode,
        issue.title,
        issue.description,
        issue.location.address,
        issue.location.district,
        issue.city,
        issue.state,
        issue.department,
        issue.category,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (query.sort === "urgency") {
      if (b.urgencyScore !== a.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (query.sort === "upvotes") {
      if (b.upvotes !== a.upvotes) {
        return b.upvotes - a.upvotes;
      }
      return b.createdAt.localeCompare(a.createdAt);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function paginateIssues(
  sorted: Issue[],
  limit: number,
  cursor?: string,
): { items: Issue[]; hasMore: boolean; nextCursor: string | null } {
  let startIndex = 0;
  if (cursor) {
    const foundIndex = sorted.findIndex((item) => item.id === cursor);
    if (foundIndex >= 0) {
      startIndex = foundIndex + 1;
    }
  }
  const items = sorted.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + items.length < sorted.length;
  const nextCursor =
    hasMore && items.length > 0 ? items[items.length - 1]!.id : null;
  return { items, hasMore, nextCursor };
}

/**
 * Lists issues with regional (`state`/`city`), ownership (`mine`), attribute filtering,
 * sorting, and cursor pagination (default `limit(20)`).
 */
export async function listIssues(
  query: ListIssuesQuery,
  currentUserUid?: string | null,
): Promise<PaginatedIssuesResponse> {
  const db = getAdminDb();

  if (db) {
    try {
      const snapshot = await db
        .collection(ISSUES_COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();

      const allIssues = snapshot.docs.map((doc) =>
        sanitizePublicIssue(doc.data() as Partial<Issue>, doc.id),
      );

      const scoped = applyScopeFilters(allIssues, query, currentUserUid);
      const stats = computeDashboardStats(scoped);
      const filtered = applyAttributeFiltersAndSort(scoped, query);
      const { items, hasMore, nextCursor } = paginateIssues(
        filtered,
        query.limit,
        query.cursor,
      );

      return {
        issues: items,
        total: filtered.length,
        hasMore,
        nextCursor,
        stats,
      };
    } catch (error) {
      console.warn(
        "[CivicResolve Repo] Firestore listIssues failed; using fallback store:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  const allMemory = getMemoryStore().map((item) => sanitizePublicIssue(item));
  const scoped = applyScopeFilters(allMemory, query, currentUserUid);
  const stats = computeDashboardStats(scoped);
  const filtered = applyAttributeFiltersAndSort(scoped, query);
  const { items, hasMore, nextCursor } = paginateIssues(
    filtered,
    query.limit,
    query.cursor,
  );

  return {
    issues: items,
    total: filtered.length,
    hasMore,
    nextCursor,
    stats,
  };
}

/** Fetches a single sanitized issue by document `id` or `referenceCode`. */
export async function getIssueById(idOrRef: string): Promise<Issue | null> {
  const normalized = idOrRef.trim();
  if (!normalized) return null;

  const db = getAdminDb();
  if (db) {
    try {
      const doc = await db.collection(ISSUES_COLLECTION).doc(normalized).get();
      if (doc.exists) {
        return sanitizePublicIssue(doc.data() as Partial<Issue>, doc.id);
      }
      const refSnap = await db
        .collection(ISSUES_COLLECTION)
        .where("referenceCode", "==", normalized.toUpperCase())
        .limit(1)
        .get();
      if (!refSnap.empty) {
        const match = refSnap.docs[0]!;
        return sanitizePublicIssue(match.data() as Partial<Issue>, match.id);
      }
      return null;
    } catch (error) {
      console.warn(
        "[CivicResolve Repo] Firestore getIssueById failed; checking fallback store:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  const memory = getMemoryStore();
  const found =
    memory.find(
      (item) =>
        item.id === normalized ||
        item.referenceCode.toLowerCase() === normalized.toLowerCase(),
    ) ?? null;

  return found ? sanitizePublicIssue(found) : null;
}

/**
 * Uploads a validated issue photo to Firebase Storage using a UBLA-compatible
 * Firebase download token URL (works with Uniform Bucket-Level Access enabled),
 * falling back to an inline data URI when Firebase Storage is unavailable.
 */
export async function uploadIssuePhoto(
  issueId: string,
  bytes: Uint8Array,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
  extension: "jpg" | "png" | "webp",
  prefix?: string,
): Promise<string> {
  const storage = getAdminStorage();
  if (storage) {
    try {
      const bucket = storage.bucket();
      const fileSlug = prefix ? `${prefix}-${Date.now()}` : `${Date.now()}`;
      const filePath = `issues/${issueId}/${fileSlug}.${extension}`;
      const downloadToken = crypto.randomUUID();
      const file = bucket.file(filePath);
      await file.save(Buffer.from(bytes), {
        metadata: {
          contentType: mimeType,
          cacheControl: "public, max-age=31536000",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });
      return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;
    } catch (error) {
      console.warn(
        "[CivicResolve Storage] Upload failed; storing inline preview fallback:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export interface CreateIssueRecordInput {
  id?: string;
  title: string;
  description: string;
  location: IssueLocation;
  photoUrl: string | null;
  reporterUid: string;
  reporterName: string;
  aiAnalysis: AIAnalysis;
}

/** Persists a newly triaged civic issue and its initial Reported timeline entry. */
export async function createIssueRecord(
  input: CreateIssueRecordInput,
): Promise<Issue> {
  const now = new Date().toISOString();
  const suffix = crypto.randomInt(1000, 9999);
  const id = input.id ?? `cr-2026-${suffix}`;
  const referenceCode = id.toUpperCase();

  const initialHistory: StatusHistoryEntry = {
    status: "Reported",
    timestamp: now,
    note: `Report submitted${input.photoUrl ? " with photo evidence" : ""}. ${
      input.aiAnalysis.source === "gemini" ? "Gemini AI" : "Automated Triage"
    } scored urgency ${input.aiAnalysis.urgencyScore}/100 and routed to ${
      input.aiAnalysis.recommendedDepartment
    }.`,
    updatedBy:
      input.aiAnalysis.source === "gemini"
        ? "CivicResolve Gemini AI Triage"
        : "CivicResolve Automated Triage",
  };

  const issue: Issue = {
    id,
    referenceCode,
    title: input.title,
    description: input.description,
    category: input.aiAnalysis.category,
    status: "Reported",
    priority: input.aiAnalysis.priority,
    urgencyScore: input.aiAnalysis.urgencyScore,
    department: input.aiAnalysis.recommendedDepartment,
    state: input.location.state,
    city: input.location.city,
    location: input.location,
    photoUrl: input.photoUrl,
    photoAltText: input.aiAnalysis.imageAltText,
    upvotes: 1,
    upvotedBy: [input.reporterUid],
    reporterUid: input.reporterUid,
    reporterName: getSafePublicReporterName(input.reporterName),
    resolutionNote: null,
    completionReport: null,
    aiAnalysis: input.aiAnalysis,
    statusHistory: [initialHistory],
    createdAt: now,
    updatedAt: now,
  };

  const db = getAdminDb();
  if (db) {
    try {
      await db.collection(ISSUES_COLLECTION).doc(issue.id).set(issue);
      return issue;
    } catch (error) {
      console.warn(
        "[CivicResolve Repo] Firestore createIssue failed; writing to fallback store:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  getMemoryStore().unshift(issue);
  return issue;
}

async function persistUpdatedIssue(updated: Issue): Promise<Issue> {
  const db = getAdminDb();
  if (db) {
    try {
      await db.collection(ISSUES_COLLECTION).doc(updated.id).set(updated);
      return updated;
    } catch (error) {
      console.warn(
        "[CivicResolve Repo] Firestore updateIssue failed; updating fallback store:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  const memory = getMemoryStore();
  const idx = memory.findIndex((item) => item.id === updated.id);
  if (idx >= 0) {
    memory[idx] = updated;
  }
  return updated;
}

export interface UpdateIssueRecordInput {
  status?: IssueStatus;
  priority?: IssuePriority;
  department?: MunicipalDepartment;
  resolutionNote?: string;
  reviewDecision?: "approve" | "reject";
  updatedBy: string;
}

/**
 * Updates issue status, department, priority, or resolution notes (including Authority
 * approval/rework decisions for `Pending Verification` complaints) and appends timeline history.
 */
export async function updateIssueRecord(
  id: string,
  updates: UpdateIssueRecordInput,
): Promise<Issue | null> {
  const existing = await getIssueById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const nextDepartment = updates.department ?? existing.department;
  const nextPriority = updates.priority ?? existing.priority;

  let nextStatus: IssueStatus = updates.status ?? existing.status;
  let nextResolutionNote =
    updates.resolutionNote !== undefined
      ? updates.resolutionNote || null
      : existing.resolutionNote;

  const noteParts: string[] = [];

  if (updates.reviewDecision === "approve") {
    nextStatus = "Resolved";
    const approvedNote =
      updates.resolutionNote?.trim() ||
      existing.completionReport?.workerNote ||
      "Municipal Authority verified field completion and closed the issue.";
    nextResolutionNote = approvedNote;
    noteParts.push("Municipal Authority approved field repair completion.");
    if (existing.completionReport?.aiVerification) {
      const ai = existing.completionReport.aiVerification;
      noteParts.push(
        `AI Verification: ${ai.verdict} (${ai.confidence}% confidence).`,
      );
    }
    noteParts.push(approvedNote);
  } else if (updates.reviewDecision === "reject") {
    nextStatus = "In Progress";
    const reworkNote =
      updates.resolutionNote?.trim() ||
      "Rework requested by Municipal Authority. Please re-inspect and submit updated photo proof.";
    nextResolutionNote = reworkNote;
    noteParts.push("Authority requested rework — returned to active field queue.");
    noteParts.push(reworkNote);
  } else {
    if (updates.status && updates.status !== existing.status) {
      noteParts.push(`Status changed to ${updates.status}.`);
    }
    if (updates.department && updates.department !== existing.department) {
      noteParts.push(`Reassigned to ${updates.department}.`);
    }
    if (updates.priority && updates.priority !== existing.priority) {
      noteParts.push(`Priority updated to ${updates.priority}.`);
    }
    if (updates.resolutionNote) {
      noteParts.push(updates.resolutionNote);
    }
  }

  const nextHistory = [...existing.statusHistory];
  if (noteParts.length > 0) {
    nextHistory.push({
      status: nextStatus,
      timestamp: now,
      note: noteParts.join(" "),
      updatedBy: updates.updatedBy,
    });
  }

  const updated: Issue = {
    ...existing,
    status: nextStatus,
    priority: nextPriority,
    department: nextDepartment,
    resolutionNote: nextResolutionNote,
    statusHistory: nextHistory,
    updatedAt: now,
  };

  return persistUpdatedIssue(updated);
}

/**
 * Moves a `Reported` issue to `In Progress` when a Field Worker begins on-site work.
 */
export async function startWorkerTask(
  id: string,
  workerName: string,
  note?: string,
): Promise<Issue | null> {
  const existing = await getIssueById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const safeWorkerName = getSafePublicReporterName(workerName);
  const entryNote =
    note?.trim() ||
    (existing.status === "Reported"
      ? "Field crew arrived on site and started repair work."
      : "Field crew logged active on-site repair update.");

  const nextHistory: StatusHistoryEntry[] = [
    ...existing.statusHistory,
    {
      status: "In Progress",
      timestamp: now,
      note: entryNote,
      updatedBy: safeWorkerName,
    },
  ];

  const updated: Issue = {
    ...existing,
    status: "In Progress",
    statusHistory: nextHistory,
    updatedAt: now,
  };

  return persistUpdatedIssue(updated);
}

export interface SubmitWorkerCompletionInput {
  afterPhotoUrl: string;
  workerUid: string;
  workerName: string;
  workerNote: string;
  aiVerification: CompletionVerification;
}

/**
 * Attaches proof-of-completion metadata + Gemini AI before-vs-after verification
 * to the issue and moves its status to `Pending Verification` for Authority sign-off.
 */
export async function submitWorkerCompletion(
  id: string,
  input: SubmitWorkerCompletionInput,
): Promise<Issue | null> {
  const existing = await getIssueById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const safeWorkerName = getSafePublicReporterName(input.workerName);
  const completionReport: CompletionReport = {
    afterPhotoUrl: input.afterPhotoUrl,
    workerUid: input.workerUid,
    workerName: safeWorkerName,
    workerNote: input.workerNote,
    submittedAt: now,
    aiVerification: input.aiVerification,
  };

  const timelineNote = `Field work submitted with after-repair photo: "${input.workerNote}" Gemini AI Verification: ${input.aiVerification.verdict} (${input.aiVerification.confidence}% confidence). Awaiting Municipal Authority approval.`;

  const updated: Issue = {
    ...existing,
    status: "Pending Verification",
    completionReport,
    statusHistory: [
      ...existing.statusHistory,
      {
        status: "Pending Verification",
        timestamp: now,
        note: timelineNote,
        updatedBy: safeWorkerName,
      },
    ],
    updatedAt: now,
  };

  return persistUpdatedIssue(updated);
}

/**
 * Toggles a single authenticated user's upvote on an issue (1 upvote per user).
 */
export async function toggleIssueUpvote(
  id: string,
  userId: string,
): Promise<{ issue: Issue; upvoted: boolean } | null> {
  const existing = await getIssueById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const db = getAdminDb();

  if (db) {
    try {
      const docRef = db.collection(ISSUES_COLLECTION).doc(existing.id);
      return await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        const current = sanitizePublicIssue(
          (snap.exists ? snap.data() : existing) as Partial<Issue>,
          existing.id,
        );
        const set = new Set(current.upvotedBy);
        const alreadyUpvoted = set.has(userId);
        let nextUpvotes = current.upvotes;
        if (alreadyUpvoted) {
          set.delete(userId);
          nextUpvotes = Math.max(0, nextUpvotes - 1);
        } else {
          set.add(userId);
          nextUpvotes += 1;
        }
        const nextUpvotedBy = Array.from(set);
        tx.update(docRef, {
          upvotedBy: nextUpvotedBy,
          upvotes: nextUpvotes,
          updatedAt: now,
        });
        return {
          issue: {
            ...current,
            upvotedBy: nextUpvotedBy,
            upvotes: nextUpvotes,
            updatedAt: now,
          },
          upvoted: !alreadyUpvoted,
        };
      });
    } catch (error) {
      console.warn(
        "[CivicResolve Repo] Firestore upvote toggle failed; updating fallback store:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  const set = new Set(existing.upvotedBy);
  const alreadyUpvoted = set.has(userId);
  let nextUpvotes = existing.upvotes;
  if (alreadyUpvoted) {
    set.delete(userId);
    nextUpvotes = Math.max(0, nextUpvotes - 1);
  } else {
    set.add(userId);
    nextUpvotes += 1;
  }

  const updated: Issue = {
    ...existing,
    upvotedBy: Array.from(set),
    upvotes: nextUpvotes,
    updatedAt: now,
  };

  const memory = getMemoryStore();
  const idx = memory.findIndex((item) => item.id === existing.id);
  if (idx >= 0) {
    memory[idx] = updated;
  }

  return { issue: updated, upvoted: !alreadyUpvoted };
}
