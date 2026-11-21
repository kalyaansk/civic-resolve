"use client";

import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  MapPin,
  Sparkles,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AuthorityDecisionPanel } from "@/components/admin/AuthorityDecisionPanel";
import { BeforeAfterComparison } from "@/components/admin/BeforeAfterComparison";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleAccessGate } from "@/components/auth/RoleAccessGate";
import { PriorityBadge, StatusBadge } from "@/components/ui/IssueBadges";
import {
  PhotoZoomDialog,
  type ZoomPhotoPayload,
} from "@/components/ui/PhotoZoomDialog";
import {
  buildGoogleMapsUrl,
  formatDateTime,
  formatFullAddress,
} from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

interface AuthorityReviewPageProps {
  initialIssue: Issue;
  pendingIds: string[];
}

export function AuthorityReviewPage({
  initialIssue,
  pendingIds,
}: AuthorityReviewPageProps) {
  const router = useRouter();
  const { user, loading, getAuthHeaders } = useAuth();

  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [resolutionNote, setResolutionNote] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState<
    "approve" | "reject" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<ZoomPhotoPayload | null>(null);

  const currentPendingIdx = pendingIds.indexOf(issue.id);
  const prevPendingId =
    currentPendingIdx > 0 ? pendingIds[currentPendingIdx - 1] : null;
  const nextPendingId =
    currentPendingIdx >= 0 && currentPendingIdx < pendingIds.length - 1
      ? pendingIds[currentPendingIdx + 1]
      : null;

  const beforeSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const fullAddress = formatFullAddress(issue);

  const handleDecision = useCallback(
    async (decision: "approve" | "reject") => {
      setErrorMessage(null);
      setSubmittingDecision(decision);

      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/issues/${issue.id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            reviewDecision: decision,
            resolutionNote: resolutionNote.trim() || undefined,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          issue?: Issue;
          error?: string;
        };

        if (!res.ok || !data.issue) {
          setErrorMessage(
            data.error || "Unable to record Authority review decision.",
          );
          setSubmittingDecision(null);
          return;
        }

        setIssue(data.issue);
        const outcome = decision === "approve" ? "approved" : "rework";
        router.push(
          `/admin?updated=${encodeURIComponent(data.issue.referenceCode)}&decision=${outcome}`,
        );
        router.refresh();
      } catch {
        setErrorMessage(
          "Network error while submitting your decision. Please try again.",
        );
        setSubmittingDecision(null);
      }
    },
    [getAuthHeaders, issue.id, resolutionNote, router],
  );

  if (loading || !user || user.role !== "authority") {
    return (
      <RoleAccessGate
        requiredRole="authority"
        returnTo={`/admin/review/${issue.id}`}
        authSubtitle={`Sign in as a Municipal Authority to review completion proof for #${issue.referenceCode}.`}
        forbiddenDescription="Approving field work completions is restricted to Municipal Authority accounts."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#1B365D] shadow-xs transition-colors hover:bg-[#F1F5F9]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Authority Console
        </Link>

        {pendingIds.length > 1 && currentPendingIdx >= 0 && (
          <nav
            aria-label="Pending approval queue navigation"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#5B21B6]"
          >
            {prevPendingId ? (
              <Link
                href={`/admin/review/${prevPendingId}`}
                aria-label="Previous pending approval"
                className="inline-flex items-center rounded-md p-1 hover:bg-[#EDE9FE]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="p-1 opacity-40" aria-hidden="true">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
            <span className="tabular-nums">
              {currentPendingIdx + 1} of {pendingIds.length} pending
            </span>
            {nextPendingId ? (
              <Link
                href={`/admin/review/${nextPendingId}`}
                aria-label="Next pending approval"
                className="inline-flex items-center rounded-md p-1 hover:bg-[#EDE9FE]"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="p-1 opacity-40" aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </nav>
        )}
      </div>

      <section className="mt-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-xs font-bold text-[#5B21B6]">
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
              Authority Completion Review
            </span>
            <span className="font-mono text-xs font-bold text-[#1B365D]">
              #{issue.referenceCode}
            </span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#0F766E]">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI Urgency {issue.urgencyScore} / 100
            </span>
          </div>

          <Link
            href={`/issues/${issue.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0369A1] hover:underline"
          >
            View Public Issue Page ↗
          </Link>
        </div>

        <h1 className="mt-3 font-headline text-2xl font-bold tracking-tight text-[#0F172A]">
          {issue.title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#334155]">
          {issue.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E2E8F0] pt-3 text-xs text-[#475569]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
            <MapPin className="h-3.5 w-3.5 text-[#0369A1]" aria-hidden="true" />
            {fullAddress}
          </span>
          <a
            href={buildGoogleMapsUrl(issue.location.lat, issue.location.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#0369A1] hover:underline"
          >
            Open in Google Maps
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B365D]">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            {issue.department}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
            Reported by {issue.reporterName} • {formatDateTime(issue.createdAt)}
          </span>
        </div>
      </section>

      <BeforeAfterComparison
        issue={issue}
        beforeSrc={beforeSrc}
        completionReport={issue.completionReport ?? null}
        onZoomPhoto={setZoomPhoto}
      />

      <AuthorityDecisionPanel
        status={issue.status}
        resolutionNote={resolutionNote}
        onResolutionNoteChange={setResolutionNote}
        submittingDecision={submittingDecision}
        errorMessage={errorMessage}
        onDecision={handleDecision}
      />

      <PhotoZoomDialog photo={zoomPhoto} onClose={() => setZoomPhoto(null)} />
    </div>
  );
}
