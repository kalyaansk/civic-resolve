"use client";

import { ArrowRight, Building2, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import {
  CompletionVerdictBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/IssueBadges";
import { isInlineOrSvgUrl } from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

interface WorkerTaskCardProps {
  issue: Issue;
}

function WorkerTaskCardBase({ issue }: WorkerTaskCardProps) {
  const thumbSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const isPending = issue.status === "Pending Verification";

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:border-[#1B365D]/40 hover:shadow-md">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#1B365D]">
              #{issue.referenceCode}
            </span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#0F766E]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Urgency {issue.urgencyScore} / 100
          </span>
        </div>

        <div className="mt-3 flex gap-3.5">
          <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]">
            <Image
              src={thumbSrc}
              alt={issue.photoAltText || issue.title}
              fill
              loading="lazy"
              decoding="async"
              unoptimized={isInlineOrSvgUrl(thumbSrc)}
              sizes="96px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-headline text-base font-bold text-[#0F172A] group-hover:text-[#0369A1]">
              <Link
                href={`/worker/tasks/${issue.id}`}
                className="hover:underline"
              >
                {issue.title}
              </Link>
            </h2>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#475569]">
              {issue.description}
            </p>
          </div>
        </div>

        {isPending && issue.completionReport && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#99EFE5] bg-[#F0FDFA] px-3 py-2 text-xs">
            <CompletionVerdictBadge
              verdict={issue.completionReport.aiVerification.verdict}
            />
            <span className="font-bold tabular-nums text-[#0F766E]">
              {issue.completionReport.aiVerification.confidence}% AI Confidence
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-3.5">
        <div className="min-w-0 space-y-1 text-xs text-[#475569]">
          <p className="flex items-center gap-1 truncate font-medium text-[#0F172A]">
            <MapPin
              className="h-3.5 w-3.5 shrink-0 text-[#0369A1]"
              aria-hidden="true"
            />
            <span className="truncate">
              {issue.location.address} • {issue.city}, {issue.state}
            </span>
          </p>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-[#1B365D]">
            <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
            {issue.department}
          </p>
        </div>

        <Link
          href={`/worker/tasks/${issue.id}`}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
            isPending
              ? "border border-[#5B21B6] bg-[#F5F3FF] text-[#5B21B6] hover:bg-[#EDE9FE]"
              : "bg-[#1B365D] text-white hover:bg-[#002046]"
          }`}
        >
          {isPending ? "View AI Report" : "Open Task"}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export const WorkerTaskCard = memo(WorkerTaskCardBase);
