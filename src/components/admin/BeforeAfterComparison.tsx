"use client";

import { Sparkles, Wrench, ZoomIn } from "lucide-react";
import Image from "next/image";
import { CompletionVerdictBadge } from "@/components/ui/IssueBadges";
import type { ZoomPhotoPayload } from "@/components/ui/PhotoZoomDialog";
import { formatDateTime, isInlineOrSvgUrl } from "@/lib/utils/formatters";
import type { CompletionReport, Issue } from "@/types/issue";

interface BeforeAfterComparisonProps {
  issue: Issue;
  beforeSrc: string;
  completionReport: CompletionReport | null;
  onZoomPhoto: (photo: ZoomPhotoPayload) => void;
}

export function BeforeAfterComparison({
  issue,
  beforeSrc,
  completionReport,
  onZoomPhoto,
}: BeforeAfterComparisonProps) {
  return (
    <>
      <section
        aria-label="Before and after visual evidence"
        className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#334155]">
              Before — Citizen Report
            </span>
            <button
              type="button"
              onClick={() =>
                onZoomPhoto({
                  src: beforeSrc,
                  label: "Before — Original Citizen Complaint Photo",
                  alt: issue.photoAltText || `Before photo for ${issue.title}`,
                })
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0369A1] hover:underline"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              Zoom
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              onZoomPhoto({
                src: beforeSrc,
                label: "Before — Original Citizen Complaint Photo",
                alt: issue.photoAltText || `Before photo for ${issue.title}`,
              })
            }
            aria-label="Zoom Before photo"
            className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]"
          >
            <Image
              src={beforeSrc}
              alt={issue.photoAltText || `Before photo for ${issue.title}`}
              fill
              decoding="async"
              unoptimized={isInlineOrSvgUrl(beforeSrc)}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </button>
        </div>

        <div className="rounded-2xl border-2 border-[#A7F3D0] bg-white p-4 shadow-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#065F46]">
              After — Field Worker Proof
            </span>
            {completionReport?.afterPhotoUrl && (
              <button
                type="button"
                onClick={() =>
                  onZoomPhoto({
                    src: completionReport.afterPhotoUrl,
                    label: "After — Field Worker Completion Proof Photo",
                    alt: `After-repair proof for ${issue.title}`,
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#065F46] hover:underline"
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                Zoom
              </button>
            )}
          </div>
          {completionReport?.afterPhotoUrl ? (
            <button
              type="button"
              onClick={() =>
                onZoomPhoto({
                  src: completionReport.afterPhotoUrl,
                  label: "After — Field Worker Completion Proof Photo",
                  alt: `After-repair proof for ${issue.title}`,
                })
              }
              aria-label="Zoom After photo"
              className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]"
            >
              <Image
                src={completionReport.afterPhotoUrl}
                alt={`After-repair proof for ${issue.title}`}
                fill
                decoding="async"
                unoptimized={isInlineOrSvgUrl(completionReport.afterPhotoUrl)}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </button>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center text-xs text-[#64748B]">
              No after-repair proof photo has been submitted for this issue yet.
            </div>
          )}
        </div>
      </section>

      {completionReport && (
        <section
          aria-label="Gemini AI Verification Report and Worker Summary"
          className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12"
        >
          <div className="rounded-2xl border-2 border-[#99EFE5] bg-gradient-to-br from-[#F0FDFA] via-white to-white p-6 shadow-sm lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Gemini AI Verification Report</span>
              </div>
              <div className="flex items-center gap-2">
                <CompletionVerdictBadge
                  verdict={completionReport.aiVerification.verdict}
                />
                <span className="rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#0F766E]">
                  {completionReport.aiVerification.confidence}% Confidence
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#0F172A]">
              {completionReport.aiVerification.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs">
              <span className="font-semibold text-[#475569]">
                AI Recommended Action:
              </span>
              <span className="font-bold text-[#0F766E]">
                {completionReport.aiVerification.recommendedAction}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-5">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 text-xs font-bold uppercase tracking-wider text-[#92400E]">
              <Wrench className="h-4 w-4" aria-hidden="true" />
              <span>Field Worker Completion Summary</span>
            </div>

            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-[#64748B]">Submitted By</dt>
                <dd className="font-bold text-[#0F172A]">
                  {completionReport.workerName}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-[#64748B]">Submitted At</dt>
                <dd className="font-medium text-[#334155]">
                  <time dateTime={completionReport.submittedAt}>
                    {formatDateTime(completionReport.submittedAt)}
                  </time>
                </dd>
              </div>
              <div className="pt-1">
                <dt className="font-semibold uppercase tracking-wider text-[#64748B]">
                  Work Note
                </dt>
                <dd className="mt-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-sm leading-relaxed text-[#0F172A]">
                  {completionReport.workerNote}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}
    </>
  );
}
