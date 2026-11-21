"use client";

import { ArrowUp, ChevronRight, MapPin, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LifecycleTimeline } from "@/components/issues/LifecycleTimeline";
import { PhotoEvidenceCard } from "@/components/issues/PhotoEvidenceCard";
import { DynamicCivicMap } from "@/components/maps/DynamicCivicMap";
import {
  AIDepartmentBadge,
  PriorityBadge,
  StatusBadge,
  UrgencyMeter,
} from "@/components/ui/IssueBadges";
import { formatDateTime, formatFullAddress } from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

interface IssueDetailViewProps {
  initialIssue: Issue;
}

export function IssueDetailView({ initialIssue }: IssueDetailViewProps) {
  const { user, getAuthHeaders, openSignInDialog } = useAuth();
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [upvoting, setUpvoting] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const upvoted = Boolean(user?.uid && issue.upvotedBy.includes(user.uid));
  const imageSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const fullAddressLabel = formatFullAddress(issue);

  const handleUpvote = useCallback(async () => {
    if (!user) {
      openSignInDialog({
        tab: "citizen",
        mode: "signin",
        message: "Sign in as a Citizen to upvote this civic issue.",
      });
      return;
    }

    setUpvoting(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/issues/${issue.id}/upvote`, {
        method: "POST",
        credentials: "same-origin",
        headers: authHeaders,
      });
      if (res.status === 401) {
        openSignInDialog({
          tab: "citizen",
          mode: "signin",
          message: "Please sign in to upvote civic issues.",
        });
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        upvotes: number;
        upvotedBy: string[];
      };
      setIssue((prev) => ({
        ...prev,
        upvotes: data.upvotes,
        upvotedBy: data.upvotedBy ?? prev.upvotedBy,
      }));
    } finally {
      setUpvoting(false);
    }
  }, [user, getAuthHeaders, issue.id, openSignInDialog]);

  const handleShare = useCallback(async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `/issues/${issue.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Link copied to clipboard.");
      } else {
        setShareMessage(`Share URL: ${shareUrl}`);
      }
    } catch {
      setShareMessage("Unable to access clipboard automatically.");
    }
  }, [issue.id]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium text-[#475569]"
      >
        <Link href="/" className="hover:text-[#1B365D] hover:underline">
          Track Issues
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 text-[#64748B]"
          aria-hidden="true"
        />
        <span className="font-semibold text-[#0F172A]">
          Issue #{issue.referenceCode}
        </span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 border-b border-[#E2E8F0] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start gap-2">
            <span className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1 font-mono text-xs font-bold text-[#1B365D]">
              #{issue.referenceCode}
            </span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            <AIDepartmentBadge department={issue.department} />
          </div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            {issue.title}
          </h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleUpvote()}
            disabled={upvoting}
            aria-pressed={upvoted}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold tabular-nums transition-colors ${
              upvoted
                ? "border-[#1B365D] bg-[#1B365D] text-white"
                : "border-[#CBD5E1] bg-white text-[#1B365D] hover:bg-[#EFF6FF]"
            }`}
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            <span>{issue.upvotes} Upvotes</span>
          </button>

          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {shareMessage && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-xs font-semibold text-[#0F766E]"
        >
          {shareMessage}
        </p>
      )}

      <div className="mt-7 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <section
            aria-labelledby="complaint-summary-heading"
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
          >
            <h2
              id="complaint-summary-heading"
              className="font-headline text-lg font-bold text-[#0F172A]"
            >
              Complaint Summary
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#334155]">
              {issue.description}
            </p>

            {issue.resolutionNote && (
              <div className="mt-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#065F46]">
                  Official Municipal Note
                </p>
                <p className="mt-1 text-sm text-[#065F46]">
                  {issue.resolutionNote}
                </p>
              </div>
            )}

            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-[#E2E8F0] pt-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Location
                </dt>
                <dd className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-[#0F172A]">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0369A1]"
                    aria-hidden="true"
                  />
                  <span>{fullAddressLabel}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Reported By
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
                  {issue.reporterName}
                  <span className="block text-xs font-medium text-[#475569]">
                    <time dateTime={issue.createdAt}>
                      {formatDateTime(issue.createdAt)}
                    </time>
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Category
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
                  {issue.category}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Assigned Department
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
                  {issue.department}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#99EFE5] bg-gradient-to-b from-[#F0FDFA] via-white to-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E] text-white">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-headline text-lg font-bold text-[#0F172A]">
                    Gemini AI Analysis Breakdown
                  </h2>
                  <p className="text-xs text-[#475569]">
                    Gemini AI Multimodal Triage ({issue.aiAnalysis.model})
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#CCFBF1] px-3 py-1 text-xs font-semibold tabular-nums text-[#0F766E]">
                {issue.aiAnalysis.confidence}% Routing Confidence
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Detected Category &amp; Priority
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#0F172A]">
                      {issue.aiAnalysis.category}
                    </span>
                    <PriorityBadge priority={issue.aiAnalysis.priority} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Recommended Department
                  </span>
                  <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                    {issue.aiAnalysis.recommendedDepartment}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <UrgencyMeter
                  score={issue.aiAnalysis.urgencyScore}
                  label="AI Urgency Score"
                />
              </div>
            </div>

            <div className="mt-5 space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                Impact &amp; AI Reasoning
              </p>
              <p className="text-sm font-medium text-[#0F172A]">
                {issue.aiAnalysis.estimatedImpact}
              </p>
              <p className="text-xs leading-relaxed text-[#475569]">
                {issue.aiAnalysis.reasoning}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PhotoEvidenceCard issue={issue} imageSrc={imageSrc} />

            <section
              aria-labelledby="location-preview-heading"
              className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
            >
              <h2
                id="location-preview-heading"
                className="mb-3 font-headline text-base font-bold text-[#0F172A]"
              >
                Location Preview
              </h2>
              <DynamicCivicMap
                mode="preview"
                title={issue.title}
                address={fullAddressLabel}
                centerLat={issue.location.lat}
                centerLng={issue.location.lng}
                heightClassName="h-44"
              />
            </section>
          </div>
        </div>

        <LifecycleTimeline
          issue={issue}
          isAuthority={user?.role === "authority"}
        />
      </div>
    </div>
  );
}
