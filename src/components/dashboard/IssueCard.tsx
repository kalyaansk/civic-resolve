"use client";

import { ArrowUp, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  AIDepartmentBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/Badges";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Issue } from "@/types/issue";

interface IssueCardProps {
  issue: Issue;
  upvoted?: boolean;
  upvoting?: boolean;
  /** Highlights the card when its pin is selected on the map. */
  selected?: boolean;
  /** `compact` renders an elongated horizontal card optimized for Split View (Map + List). */
  variant?: "full" | "compact";
  onUpvote: (issueId: string) => void;
  /** Called on hover or keyboard focus so the map can focus the matching pin. */
  onFocusIssue?: (issueId: string) => void;
}

export function IssueCard({
  issue,
  upvoted = false,
  upvoting = false,
  selected = false,
  variant = "full",
  onUpvote,
  onFocusIssue,
}: IssueCardProps) {
  const imageSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const isInlineOrSvg =
    imageSrc.startsWith("data:") ||
    imageSrc.startsWith("blob:") ||
    imageSrc.endsWith(".svg");
  const compact = variant === "compact";

  return (
    <article
      id={`issue-card-${issue.id}`}
      data-selected={selected}
      onMouseEnter={() => onFocusIssue?.(issue.id)}
      onFocus={() => onFocusIssue?.(issue.id)}
      className={cn(
        "group flex overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        compact ? "flex-col sm:flex-row" : "flex-col",
        selected
          ? "border-[#1B365D] ring-2 ring-[#1B365D]/30"
          : "border-[#E2E8F0]",
      )}
    >
      <Link
        href={`/issues/${issue.id}`}
        tabIndex={compact ? -1 : undefined}
        aria-hidden={compact ? true : undefined}
        className={cn(
          "relative block overflow-hidden bg-[#F1F5F9]",
          compact
            ? "aspect-video w-full sm:aspect-auto sm:w-36 md:w-40 shrink-0 sm:self-stretch"
            : "aspect-video w-full",
        )}
      >
        <Image
          src={imageSrc}
          alt={compact ? "" : issue.photoAltText || issue.title}
          fill
          unoptimized={isInlineOrSvg}
          sizes={
            compact
              ? "(max-width: 640px) 100vw, 160px"
              : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          }
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {!compact && (
          <span className="absolute top-3 left-3 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#1B365D] shadow-xs">
            #{issue.referenceCode}
          </span>
        )}
      </Link>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-between",
          compact ? "gap-3 p-4" : "gap-4 p-5",
        )}
      >
        <div className={compact ? "space-y-2" : "space-y-3"}>
          <div className="flex flex-wrap items-center gap-2">
            {compact && (
              <span className="font-mono text-[11px] font-bold text-[#1B365D]">
                #{issue.referenceCode}
              </span>
            )}
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>

          <div>
            <h2
              className={cn(
                "font-headline font-bold leading-snug text-[#0F172A]",
                compact ? "text-base" : "text-base",
              )}
            >
              <Link
                href={`/issues/${issue.id}`}
                className="hover:text-[#0369A1] hover:underline"
              >
                {issue.title}
              </Link>
            </h2>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#475569]">
              {issue.description}
            </p>
          </div>

          <p className="flex items-start gap-1.5 text-xs font-medium text-[#475569]">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0369A1]"
              aria-hidden="true"
            />
            <span className="min-w-0 truncate">
              {issue.location.address} • {issue.city}, {issue.state}
            </span>
            <span aria-hidden="true">•</span>
            <span suppressHydrationWarning className="shrink-0 text-[#64748B]">
              {formatRelativeTime(issue.createdAt)}
            </span>
          </p>
        </div>

        <div className="flex items-end justify-between gap-2 border-t border-[#E2E8F0] pt-3">
          <AIDepartmentBadge department={issue.department} />
          <button
            type="button"
            onClick={() => onUpvote(issue.id)}
            disabled={upvoting}
            aria-label={`Upvote issue ${issue.referenceCode}, current count ${issue.upvotes}`}
            aria-pressed={upvoted}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold tabular-nums transition-colors ${
              upvoted
                ? "border-[#1B365D] bg-[#1B365D] text-white"
                : "border-[#CBD5E1] bg-[#F8FAFC] text-[#1B365D] hover:bg-[#EFF6FF]"
            } disabled:opacity-60`}
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{issue.upvotes}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
