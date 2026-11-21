"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wrench,
  X,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CompletionVerdictBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/Badges";
import { buildGoogleMapsUrl, formatDateTime } from "@/lib/utils";
import type { Issue } from "@/types/issue";

interface AuthorityReviewPageProps {
  initialIssue: Issue;
  pendingIds: string[];
}

const MAX_NOTE_LENGTH = 1000;

const AUTHORITY_QUICK_NOTES = [
  "Verified before-and-after repair evidence; approved for public closure.",
  "Repair meets municipal safety standards; issue resolved.",
  "After photo does not clearly verify hazard clearance; please re-inspect and re-upload.",
] as const;

function isInlineOrSvgUrl(src: string): boolean {
  return (
    src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg")
  );
}

export function AuthorityReviewPage({
  initialIssue,
  pendingIds,
}: AuthorityReviewPageProps) {
  const router = useRouter();
  const {
    user,
    loading,
    demoEnabled,
    signInDemoAdmin,
    getAuthHeaders,
    openSignInDialog,
  } = useAuth();

  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [resolutionNote, setResolutionNote] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState<
    "approve" | "reject" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<{
    src: string;
    label: string;
    alt: string;
  } | null>(null);

  const isAuthority = user?.role === "authority";

  const currentPendingIdx = pendingIds.indexOf(issue.id);
  const prevPendingId =
    currentPendingIdx > 0 ? pendingIds[currentPendingIdx - 1] : null;
  const nextPendingId =
    currentPendingIdx >= 0 && currentPendingIdx < pendingIds.length - 1
      ? pendingIds[currentPendingIdx + 1]
      : null;

  const beforeSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const completionReport = issue.completionReport ?? null;
  const fullAddress = [
    issue.location.address,
    issue.location.district,
    issue.city,
    issue.state,
  ]
    .filter(Boolean)
    .join(", ");

  const handleDecision = async (decision: "approve" | "reject") => {
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
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-12">
        <p className="text-sm font-medium text-[#475569]">
          Verifying municipal authority session...
        </p>
      </div>
    );
  }

  if (user && !isAuthority) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <section
          role="alert"
          className="rounded-2xl border border-[#FECACA] bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#991B1B]">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#991B1B]">
            HTTP 403 • Access Denied
          </p>
          <h1 className="mt-1 font-headline text-2xl font-bold text-[#0F172A]">
            403 Restricted — Municipal Authorities Only
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            You are signed in as{" "}
            <strong>
              {user.role === "worker" ? "Field Worker" : "Citizen"}
            </strong>{" "}
            ({user.displayName}). Approving field work completions is restricted
            to Municipal Authority accounts.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user.role === "worker" ? "/worker" : "/"}
              className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
            >
              {user.role === "worker"
                ? "Return to Field Tasks"
                : "Return to Public Dashboard"}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B365D] text-white">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#0F172A]">
                Municipal Authority Authentication Required
              </h1>
              <p className="text-sm text-[#475569]">
                Sign in as a Municipal Authority to review completion proof for
                #{issue.referenceCode}.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {demoEnabled && (
              <button
                type="button"
                onClick={() => void signInDemoAdmin()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59]"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Evaluator / Demo Authority Access
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                openSignInDialog({
                  tab: "authority",
                  mode: "signin",
                  returnTo: `/admin/review/${issue.id}`,
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              Official Authority Sign-In
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-12">
      {/* Top Navigation & Multi-Pending Switcher */}
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

      {/* Issue Summary Header Card */}
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

      {/* Side-by-Side Before vs. After Photo Comparison */}
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
                setZoomPhoto({
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
              setZoomPhoto({
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
                  setZoomPhoto({
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
                setZoomPhoto({
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

      {/* Gemini AI Verification Report + Field Worker Summary */}
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

      {/* Authority Decision Box */}
      <section
        aria-label="Authority approval decision"
        className="mt-6 rounded-2xl border-2 border-[#CBD5E1] bg-white p-6 shadow-md"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
          <ShieldCheck className="h-5 w-5 text-[#1B365D]" aria-hidden="true" />
          <h2>Authority Approval Decision</h2>
        </div>

        {issue.status !== "Pending Verification" ? (
          <div className="mt-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm text-[#1E40AF]">
            <p className="font-semibold">
              This issue is currently marked as <strong>{issue.status}</strong>.
            </p>
            <p className="mt-1 text-xs">
              Completion approval actions are only active while an issue is in{" "}
              <strong>Pending Verification</strong>.
            </p>
            <div className="mt-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B365D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002046]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Return to Authority Console
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#991B1B]"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="authority-review-note"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Official Authority Closing / Rework Note (Optional)
                </label>
                <span className="text-[11px] tabular-nums text-[#64748B]">
                  {resolutionNote.length} / {MAX_NOTE_LENGTH}
                </span>
              </div>

              <div
                role="group"
                aria-label="Quick-fill authority notes"
                className="mt-2 flex flex-wrap gap-1.5"
              >
                {AUTHORITY_QUICK_NOTES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setResolutionNote(template)}
                    className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
                  >
                    + {template}
                  </button>
                ))}
              </div>

              <textarea
                id="authority-review-note"
                rows={3}
                maxLength={MAX_NOTE_LENGTH}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Add an official closing note for citizens or specific rework instructions for the field crew..."
                className="mt-2 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm leading-relaxed text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={submittingDecision !== null}
                onClick={() => void handleDecision("approve")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#065F46] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#064E3B] disabled:opacity-60"
              >
                {submittingDecision === "approve" ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Approving &amp; Marking Resolved...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Approve &amp; Mark Resolved
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submittingDecision !== null}
                onClick={() => void handleDecision("reject")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-6 py-3 text-sm font-semibold text-[#991B1B] transition-colors hover:bg-[#FEE2E2] disabled:opacity-60"
              >
                {submittingDecision === "reject" ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Returning to Field Worker...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Request Rework (Return to Worker)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Photo Zoom Lightbox Dialog */}
      <Dialog.Root
        open={zoomPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setZoomPhoto(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 pb-3">
              <Dialog.Title className="font-headline text-sm font-bold text-[#0F172A]">
                {zoomPhoto?.label}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close zoomed photo"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
            {zoomPhoto && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0F172A]">
                <Image
                  src={zoomPhoto.src}
                  alt={zoomPhoto.alt}
                  fill
                  unoptimized={isInlineOrSvgUrl(zoomPhoto.src)}
                  sizes="94vw"
                  className="object-contain"
                />
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
