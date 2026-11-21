"use client";

import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Flag,
  History,
  Loader2,
  MapPin,
  MinusCircle,
  OctagonAlert,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  CompletionVerdictBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/Badges";
import { RadioPills, type RadioPillOption } from "@/components/ui/RadioPills";
import { buildGoogleMapsUrl, formatDateTime } from "@/lib/utils";
import {
  MUNICIPAL_DEPARTMENTS,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  type MunicipalDepartment,
} from "@/types/issue";

interface ResolutionDrawerProps {
  issue: Issue;
  saving: boolean;
  onSave: (
    issueId: string,
    payload: {
      status?: IssueStatus;
      department?: MunicipalDepartment;
      priority?: IssuePriority;
      resolutionNote?: string;
      reviewDecision?: "approve" | "reject";
    },
  ) => Promise<void>;
}

const MAX_NOTE_LENGTH = 1000;

const STATUS_OPTIONS: readonly RadioPillOption<IssueStatus>[] = [
  {
    value: "Reported",
    label: "Reported",
    icon: <Flag className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: "In Progress",
    label: "In Progress",
    icon: <Clock className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: "Pending Verification",
    label: "Pending Verification",
    icon: <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#5B21B6] bg-[#5B21B6]",
  },
  {
    value: "Resolved",
    label: "Resolved",
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#065F46] bg-[#065F46]",
  },
];

const PRIORITY_OPTIONS: readonly RadioPillOption<IssuePriority>[] = [
  {
    value: "Low",
    label: "Low",
    icon: <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#334155] bg-[#334155]",
  },
  {
    value: "Medium",
    label: "Medium",
    icon: <MinusCircle className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#854D0E] bg-[#854D0E]",
  },
  {
    value: "High",
    label: "High",
    icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#9A3412] bg-[#9A3412]",
  },
  {
    value: "Critical",
    label: "Critical",
    icon: <OctagonAlert className="h-3.5 w-3.5" aria-hidden="true" />,
    checkedClassName: "border-[#991B1B] bg-[#991B1B]",
  },
];

const QUICK_FILL_NOTES = [
  "Field crew dispatched",
  "Site inspection in progress",
  "Repair completed & verified",
] as const;

function isInlineOrSvgUrl(src: string): boolean {
  return (
    src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg")
  );
}

/**
 * Operations Inspector: full issue context, highlighted AI-Verified Completion Review
 * for Pending Verification reports, recent activity, and status/priority/note controls.
 */
export function ResolutionDrawer({
  issue,
  saving,
  onSave,
}: ResolutionDrawerProps) {
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [department, setDepartment] = useState<MunicipalDepartment>(
    issue.department,
  );
  const [priority, setPriority] = useState<IssuePriority>(issue.priority);
  const [resolutionNote, setResolutionNote] = useState(
    issue.resolutionNote ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const imageSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const completionReport = issue.completionReport ?? null;
  const showPendingReviewBox =
    issue.status === "Pending Verification" && Boolean(completionReport);

  const fullAddress = [
    issue.location.address,
    issue.location.district,
    issue.city,
    issue.state,
  ]
    .filter(Boolean)
    .join(", ");

  const recentActivity = [...issue.statusHistory].slice(-3).reverse();

  const handleQuickFill = (text: string) => {
    const sentence = `${text}.`;
    setResolutionNote((prev) => {
      const trimmed = prev.trim();
      if (trimmed.includes(sentence)) return prev;
      const next = trimmed ? `${trimmed} ${sentence}` : sentence;
      return next.slice(0, MAX_NOTE_LENGTH);
    });
  };

  const handleReviewDecision = async (decision: "approve" | "reject") => {
    setError(null);
    try {
      await onSave(issue.id, {
        reviewDecision: decision,
        resolutionNote: resolutionNote.trim() || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to record Authority review decision.",
      );
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await onSave(issue.id, {
        status,
        department,
        priority,
        resolutionNote: resolutionNote.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish update.");
    }
  };

  return (
    <aside
      aria-label={`Operations Inspector for issue ${issue.referenceCode}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-xl lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#1B365D]">
            #{issue.referenceCode}
          </span>
          <h2 className="font-headline text-sm font-bold text-[#0F172A]">
            Operations Inspector
          </h2>
        </div>
        <Link
          href={`/issues/${issue.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0369A1] hover:bg-[#EFF6FF]"
        >
          View Full Page
          <span aria-hidden="true">↗</span>
          <span className="sr-only"> for issue {issue.referenceCode}</span>
        </Link>
      </div>

      <div className="space-y-4 p-5">
        {/* Highlighted AI-Verified Completion Review for Pending Verification issues */}
        {showPendingReviewBox && completionReport && (
          <section
            aria-label="AI-Verified Completion Review"
            className="space-y-3 rounded-2xl border-2 border-[#DDD6FE] bg-gradient-to-b from-[#F5F3FF] to-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5B21B6]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>AI-Verified Completion Review</span>
              </div>
              <CompletionVerdictBadge
                verdict={completionReport.aiVerification.verdict}
              />
            </div>

            <Link
              href={`/admin/review/${issue.id}`}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#DDD6FE] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B21B6] transition-colors hover:bg-[#EDE9FE]"
            >
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
              Open Full Side-by-Side Review Page →
            </Link>

            {/* Before vs. After photos side-by-side */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  Before
                </p>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-[#CBD5E1] bg-[#F1F5F9]">
                  <Image
                    src={imageSrc}
                    alt={`Before photo for ${issue.title}`}
                    fill
                    unoptimized={isInlineOrSvgUrl(imageSrc)}
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#065F46]">
                  After (Worker Proof)
                </p>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-[#A7F3D0] bg-[#ECFDF5]">
                  <Image
                    src={completionReport.afterPhotoUrl}
                    alt={`After-repair proof for ${issue.title}`}
                    fill
                    unoptimized={isInlineOrSvgUrl(
                      completionReport.afterPhotoUrl,
                    )}
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="font-bold text-[#0F172A]">
                  Worker: {completionReport.workerName}
                </span>
                <time
                  dateTime={completionReport.submittedAt}
                  className="text-[#64748B]"
                >
                  {formatDateTime(completionReport.submittedAt)}
                </time>
              </div>
              <p className="text-[#334155]">{completionReport.workerNote}</p>
            </div>

            <div className="rounded-xl border border-[#99EFE5] bg-[#F0FDFA] p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-[#0F766E]">
                <span>Gemini Visual Comparison</span>
                <span className="tabular-nums">
                  {completionReport.aiVerification.confidence}% Confidence
                </span>
              </div>
              <p className="leading-relaxed text-[#334155]">
                {completionReport.aiVerification.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleReviewDecision("approve")}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#065F46] px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#064E3B] disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Approve &amp; Mark Resolved
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleReviewDecision("reject")}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#991B1B] transition-colors hover:bg-[#FEE2E2] disabled:opacity-60"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Request Rework
              </button>
            </div>
          </section>
        )}

        {/* Issue context */}
        <section aria-label="Issue details" className="space-y-3">
          <div className="flex gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F1F5F9]">
              <Image
                src={imageSrc}
                alt={issue.photoAltText || `Photo evidence for ${issue.title}`}
                fill
                unoptimized={isInlineOrSvgUrl(imageSrc)}
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-bold leading-snug text-[#0F172A]">
                {issue.title}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#0F766E]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Urgency {issue.urgencyScore} / 100
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-[#334155]">
            {issue.description}
          </p>

          <dl className="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[#64748B]">
                Reported By
              </dt>
              <dd className="mt-0.5 font-semibold text-[#0F172A]">
                {issue.reporterName}
                <span className="font-medium text-[#475569]">
                  {" "}
                  •{" "}
                  <time dateTime={issue.createdAt}>
                    {formatDateTime(issue.createdAt)}
                  </time>
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[#64748B]">
                Location
              </dt>
              <dd className="mt-0.5 flex items-start gap-1.5 font-semibold text-[#0F172A]">
                <MapPin
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0369A1]"
                  aria-hidden="true"
                />
                <span>{fullAddress}</span>
              </dd>
              <dd className="mt-1">
                <a
                  href={buildGoogleMapsUrl(
                    issue.location.lat,
                    issue.location.lng,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0369A1] hover:underline"
                >
                  Open in Google Maps
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </dd>
            </div>
          </dl>

          <div className="rounded-xl border border-[#99EFE5] bg-[#F0FDFA] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Gemini AI Reasoning
            </p>
            <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-[#334155]">
              {issue.aiAnalysis.reasoning}
            </p>
          </div>
        </section>

        {/* Recent activity */}
        <section aria-label="Recent activity">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
            <History className="h-3.5 w-3.5 text-[#1B365D]" aria-hidden="true" />
            Recent Activity
          </h3>
          <ul className="mt-2 space-y-2">
            {recentActivity.length === 0 && (
              <li className="text-xs text-[#64748B]">
                No progress logged yet.
              </li>
            )}
            {recentActivity.map((entry, idx) => (
              <li
                key={`${entry.timestamp}-${idx}`}
                className="rounded-lg border border-[#E2E8F0] bg-white p-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <StatusBadge status={entry.status} />
                  <time
                    dateTime={entry.timestamp}
                    className="text-[11px] font-medium text-[#64748B]"
                  >
                    {formatDateTime(entry.timestamp)}
                  </time>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#334155]">
                  {entry.note}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">
                  By {entry.updatedBy}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Update controls */}
        <form
          onSubmit={handleSubmit}
          aria-label="Resolution and status update"
          className="space-y-4 border-t border-[#E2E8F0] pt-4"
        >
          <h3 className="font-headline text-sm font-bold text-[#0F172A]">
            Resolution &amp; Status Update
          </h3>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#991B1B]"
            >
              {error}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[#0F172A]">
              Update Status
            </p>
            <RadioPills
              label="Update Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
              disabled={saving}
              className="mt-1.5 grid grid-cols-2 gap-2"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-[#0F172A]">
              Priority Level
            </p>
            <RadioPills
              label="Priority Level"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={setPriority}
              disabled={saving}
              className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4"
            />
          </div>

          <div>
            <label
              htmlFor="drawer-department"
              className="block text-xs font-semibold text-[#0F172A]"
            >
              Reassign Department
            </label>
            <select
              id="drawer-department"
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value as MunicipalDepartment)
              }
              className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#0F172A] focus:bg-white"
            >
              {MUNICIPAL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="drawer-resolution-note"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Public Resolution Note
              </label>
              <span className="text-[11px] tabular-nums text-[#64748B]">
                {resolutionNote.length} / 1,000
              </span>
            </div>

            <div
              role="group"
              aria-label="Quick-fill note templates"
              className="mt-1.5 flex flex-wrap gap-1.5"
            >
              {QUICK_FILL_NOTES.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => handleQuickFill(text)}
                  className="rounded-full border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
                >
                  + {text}
                </button>
              ))}
            </div>

            <textarea
              id="drawer-resolution-note"
              rows={4}
              maxLength={MAX_NOTE_LENGTH}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe field crew dispatch, inspection findings, or final completion details..."
              className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2.5 text-sm leading-relaxed text-[#0F172A] focus:bg-white"
            />
            <p className="mt-1 text-[11px] text-[#64748B]">
              Saved directly to the public tracking timeline on the issue page.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1B365D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#002046] disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save &amp; Publish Update
              </>
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}
