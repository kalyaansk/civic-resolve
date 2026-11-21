"use client";

import { ArrowLeft, CheckCircle2, FileCheck2, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CompletionVerdictBadge } from "@/components/ui/IssueBadges";
import { formatDateTime, isInlineOrSvgUrl } from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

interface WorkerVerificationSummaryProps {
  issue: Issue;
  beforeSrc: string;
}

export function WorkerVerificationSummary({
  issue,
  beforeSrc,
}: WorkerVerificationSummaryProps) {
  const completionReport = issue.completionReport ?? null;
  const isResolved = issue.status === "Resolved";

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Gemini AI Verification Report"
      className="mt-6 space-y-5 rounded-2xl border-2 border-[#99EFE5] bg-gradient-to-br from-[#F0FDFA] via-white to-white p-6 shadow-md"
    >
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Gemini AI Verification Report
            </span>
            {completionReport && (
              <>
                <CompletionVerdictBadge
                  verdict={completionReport.aiVerification.verdict}
                />
                <span className="rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#0F766E]">
                  {completionReport.aiVerification.confidence}% Confidence
                </span>
              </>
            )}
          </div>
          <h2 className="font-headline text-xl font-bold text-[#0F172A]">
            {isResolved
              ? "Approved & Resolved by Municipal Authority"
              : "Completion Proof Analyzed & Submitted"}
          </h2>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3.5 py-1.5 text-xs font-bold sm:self-center ${
            isResolved
              ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
              : "border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6]"
          }`}
        >
          {isResolved ? (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approved &amp; Published as Resolved
            </>
          ) : (
            <>
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              Report Sent to Municipal Authority for Approval
            </>
          )}
        </span>
      </div>

      {completionReport && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#CBD5E1] bg-white p-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                Before — Original Complaint
              </p>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-[#F1F5F9]">
                <Image
                  src={beforeSrc}
                  alt={`Before photo for ${issue.title}`}
                  fill
                  loading="lazy"
                  decoding="async"
                  unoptimized={isInlineOrSvgUrl(beforeSrc)}
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#A7F3D0] bg-white p-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#065F46]">
                After — Your Uploaded Proof
              </p>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-[#ECFDF5]">
                <Image
                  src={completionReport.afterPhotoUrl}
                  alt={`After-repair proof for ${issue.title}`}
                  fill
                  loading="lazy"
                  decoding="async"
                  unoptimized={isInlineOrSvgUrl(completionReport.afterPhotoUrl)}
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-[#99EFE5] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Visual Comparison Summary
            </p>
            <p className="text-sm leading-relaxed text-[#0F172A]">
              {completionReport.aiVerification.summary}
            </p>
            <p className="text-xs text-[#475569]">
              <strong>Worker Note ({completionReport.workerName}):</strong>{" "}
              {completionReport.workerNote} •{" "}
              <time dateTime={completionReport.submittedAt}>
                {formatDateTime(completionReport.submittedAt)}
              </time>
            </p>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/worker"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#002046]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Return to Field Tasks
        </Link>
        <Link
          href={`/issues/${issue.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-xs font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
        >
          View Public Issue Timeline ↗
        </Link>
      </div>
    </section>
  );
}
