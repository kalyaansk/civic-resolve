"use client";

import { ExternalLink, History, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { PendingCompletionReviewCard } from "@/components/admin/PendingCompletionReviewCard";
import { ResolutionUpdateForm } from "@/components/admin/ResolutionUpdateForm";
import { PriorityBadge, StatusBadge } from "@/components/ui/IssueBadges";
import {
  buildGoogleMapsUrl,
  formatDateTime,
  formatFullAddress,
  isInlineOrSvgUrl,
} from "@/lib/utils/formatters";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
  MunicipalDepartment,
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
  const fullAddress = formatFullAddress(issue);

  const recentActivity = useMemo(
    () => [...issue.statusHistory].slice(-3).reverse(),
    [issue.statusHistory],
  );

  const handleQuickFill = useCallback((text: string) => {
    const sentence = `${text}.`;
    setResolutionNote((prev) => {
      const trimmed = prev.trim();
      if (trimmed.includes(sentence)) return prev;
      const next = trimmed ? `${trimmed} ${sentence}` : sentence;
      return next.slice(0, MAX_NOTE_LENGTH);
    });
  }, []);

  const handleReviewDecision = useCallback(
    async (decision: "approve" | "reject") => {
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
    },
    [issue.id, onSave, resolutionNote],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
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
        setError(
          err instanceof Error ? err.message : "Failed to publish update.",
        );
      }
    },
    [issue.id, onSave, status, department, priority, resolutionNote],
  );

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
        {showPendingReviewBox && completionReport && (
          <PendingCompletionReviewCard
            issue={issue}
            beforeSrc={imageSrc}
            completionReport={completionReport}
            saving={saving}
            onDecision={handleReviewDecision}
          />
        )}

        <section aria-label="Issue details" className="space-y-3">
          <div className="flex gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F1F5F9]">
              <Image
                src={imageSrc}
                alt={issue.photoAltText || `Photo evidence for ${issue.title}`}
                fill
                loading="lazy"
                decoding="async"
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

        <ResolutionUpdateForm
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          department={department}
          onDepartmentChange={setDepartment}
          resolutionNote={resolutionNote}
          onResolutionNoteChange={setResolutionNote}
          onQuickFill={handleQuickFill}
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
        />
      </div>
    </aside>
  );
}
