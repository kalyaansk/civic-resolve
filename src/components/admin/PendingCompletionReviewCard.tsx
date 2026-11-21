"use client";

import { CheckCircle2, FileCheck2, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CompletionVerdictBadge } from "@/components/ui/IssueBadges";
import { formatDateTime, isInlineOrSvgUrl } from "@/lib/utils/formatters";
import type { CompletionReport, Issue } from "@/types/issue";

interface PendingCompletionReviewCardProps {
  issue: Issue;
  beforeSrc: string;
  completionReport: CompletionReport;
  saving: boolean;
  onDecision: (decision: "approve" | "reject") => Promise<void>;
}

export function PendingCompletionReviewCard({
  issue,
  beforeSrc,
  completionReport,
  saving,
  onDecision,
}: PendingCompletionReviewCardProps) {
  return (
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

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            Before
          </p>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-[#CBD5E1] bg-[#F1F5F9]">
            <Image
              src={beforeSrc}
              alt={`Before photo for ${issue.title}`}
              fill
              loading="lazy"
              decoding="async"
              unoptimized={isInlineOrSvgUrl(beforeSrc)}
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
              loading="lazy"
              decoding="async"
              unoptimized={isInlineOrSvgUrl(completionReport.afterPhotoUrl)}
              sizes="180px"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs">
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

      <div className="space-y-1 rounded-xl border border-[#99EFE5] bg-[#F0FDFA] p-3 text-xs">
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
          onClick={() => void onDecision("approve")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#065F46] px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#064E3B] disabled:opacity-60"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Approve &amp; Mark Resolved
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onDecision("reject")}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#991B1B] transition-colors hover:bg-[#FEE2E2] disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Request Rework
        </button>
      </div>
    </section>
  );
}
