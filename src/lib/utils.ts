import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { escapeCsvCell } from "@/lib/security/sanitize";
import {
  ISSUE_STATUSES,
  type DashboardStats,
  type Issue,
  type IssueStatus,
  type StatusHistoryEntry,
} from "@/types/issue";

/**
 * Merges Tailwind CSS classes cleanly without conflicting specificity.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats geographic coordinates with accurate hemisphere labels (N/S and E/W).
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Computes aggregate KPI statistics for a given list of issues.
 */
export function computeDashboardStats(issues: Issue[]): DashboardStats {
  const total = issues.length;
  const reported = issues.filter((i) => i.status === "Reported").length;
  const inProgress = issues.filter((i) => i.status === "In Progress").length;
  const pendingVerification = issues.filter(
    (i) => i.status === "Pending Verification",
  ).length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;
  const critical = issues.filter(
    (i) => i.priority === "Critical" && i.status !== "Resolved",
  ).length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return {
    total,
    reported,
    inProgress,
    pendingVerification,
    resolved,
    critical,
    resolutionRate,
  };
}

/**
 * Formats an ISO timestamp into a readable municipal date/time string.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formats an ISO timestamp into a compact relative age label (e.g., "2h ago").
 */
export function formatRelativeTime(
  iso: string,
  nowMs: number = Date.now(),
): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "Recently";
  const diffSeconds = Math.max(0, Math.floor((nowMs - target) / 1000));
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDateTime(iso);
}

/**
 * Serializes filtered civic issues as a safe RFC-4180 CSV dataset for Open Data downloads.
 */
export function formatIssuesAsCsv(issues: Issue[]): string {
  const headers = [
    "Reference ID",
    "Title",
    "Category",
    "Status",
    "Priority",
    "Urgency Score",
    "Department",
    "State",
    "City",
    "District",
    "Address",
    "Latitude",
    "Longitude",
    "Upvotes",
    "AI Source",
    "AI Confidence",
    "Created At",
    "Updated At",
    "Resolution Note",
  ];

  const rows = issues.map((issue) => [
    issue.referenceCode,
    issue.title,
    issue.category,
    issue.status,
    issue.priority,
    issue.urgencyScore,
    issue.department,
    issue.state || issue.location.state,
    issue.city || issue.location.city,
    issue.location.district,
    issue.location.address,
    issue.location.lat,
    issue.location.lng,
    issue.upvotes,
    issue.aiAnalysis.source,
    issue.aiAnalysis.confidence,
    issue.createdAt,
    issue.updatedAt,
    issue.resolutionNote ?? "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

/**
 * Serializes filtered civic issues as a formatted Open311-inspired JSON document.
 */
export function formatIssuesAsJson(issues: Issue[]): string {
  return JSON.stringify(
    {
      schema: "civicresolve-open-data-v2",
      exportedAt: new Date().toISOString(),
      count: issues.length,
      issues: issues.map((issue) => ({
        id: issue.id,
        referenceCode: issue.referenceCode,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        urgencyScore: issue.urgencyScore,
        department: issue.department,
        state: issue.state || issue.location.state,
        city: issue.city || issue.location.city,
        location: issue.location,
        upvotes: issue.upvotes,
        aiAnalysis: issue.aiAnalysis,
        statusHistory: issue.statusHistory,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolutionNote: issue.resolutionNote,
      })),
    },
    null,
    2,
  );
}

/**
 * Builds a Google Maps deep link for a coordinate pair.
 */
export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lat},${lng}`,
  )}`;
}

/** Visual state of a single municipal lifecycle stage. */
export type LifecycleStageState = "completed" | "current" | "pending";

export interface LifecycleStage {
  status: IssueStatus;
  state: LifecycleStageState;
  /** All status-history entries recorded for this stage, oldest first. */
  entries: StatusHistoryEntry[];
}

/**
 * Always returns all 4 municipal lifecycle stages (`Reported` -> `In Progress` ->
 * `Pending Verification` -> `Resolved`) in order, classifying each as completed, current,
 * or pending based on the issue's status. Resolved is treated as a completed terminal stage.
 */
export function buildLifecycleStages(
  issue: Pick<Issue, "status" | "statusHistory">,
): LifecycleStage[] {
  const currentIndex = ISSUE_STATUSES.indexOf(issue.status);
  return ISSUE_STATUSES.map((status, index) => {
    const entries = issue.statusHistory.filter((e) => e.status === status);
    let state: LifecycleStageState;
    if (index < currentIndex || (index === currentIndex && status === "Resolved")) {
      state = "completed";
    } else if (index === currentIndex) {
      state = "current";
    } else {
      state = "pending";
    }
    return { status, state, entries };
  });
}
