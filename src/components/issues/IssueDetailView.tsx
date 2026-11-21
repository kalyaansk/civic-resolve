"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUp,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  Flag,
  MapPin,
  Maximize2,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CivicMap } from "@/components/maps/CivicMap";
import {
  AIDepartmentBadge,
  CompletionVerdictBadge,
  PriorityBadge,
  StatusBadge,
  UrgencyMeter,
} from "@/components/ui/Badges";
import { buildLifecycleStages, formatDateTime } from "@/lib/utils";
import type { Issue, IssueStatus } from "@/types/issue";

interface IssueDetailViewProps {
  initialIssue: Issue;
}

function getStageIcon(status: IssueStatus) {
  switch (status) {
    case "Reported":
      return Flag;
    case "In Progress":
      return Clock;
    case "Pending Verification":
      return FileCheck2;
    case "Resolved":
      return CheckCircle2;
    default:
      return Flag;
  }
}

function ZoomableEvidencePhoto({
  src,
  alt,
  triggerLabel,
  dialogTitle,
  badgeText,
  heightClass = "h-44",
}: {
  src: string;
  alt: string;
  triggerLabel: string;
  dialogTitle: string;
  badgeText?: string;
  heightClass?: string;
}) {
  const unoptimized =
    src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg");
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className={`group relative block ${heightClass} w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]`}
        >
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized={unoptimized}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {badgeText && (
            <span className="absolute top-2 left-2 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F172A] shadow-xs">
              {badgeText}
            </span>
          )}
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1B365D] shadow-sm">
            <Maximize2 className="h-3 w-3" aria-hidden="true" />
            Click to enlarge
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0F172A]/75 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby="photo-lightbox-description"
          className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl focus:outline-none"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="font-headline text-base font-bold text-[#0F172A]">
                {dialogTitle}
              </Dialog.Title>
              <Dialog.Description
                id="photo-lightbox-description"
                className="text-xs text-[#475569]"
              >
                {alt}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close photo viewer"
              className="rounded-lg p-1.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl bg-[#F1F5F9]">
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized={unoptimized}
              sizes="(max-width: 1024px) 94vw, 896px"
              className="object-contain"
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function IssueDetailView({ initialIssue }: IssueDetailViewProps) {
  const { user, getAuthHeaders, openSignInDialog } = useAuth();
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [upvoting, setUpvoting] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const upvoted = Boolean(user?.uid && issue.upvotedBy.includes(user.uid));
  const imageSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const hasResolutionProof = Boolean(issue.completionReport?.afterPhotoUrl);

  const handleUpvote = async () => {
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
  };

  const handleShare = async () => {
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : `/issues/${issue.id}`;
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
  };

  const slaTarget =
    issue.priority === "Critical"
      ? "Immediate dispatch (< 4 hours)"
      : issue.priority === "High"
        ? "24–48 hours"
        : issue.priority === "Medium"
          ? "3–5 business days"
          : "7–14 business days";

  const fullAddressLabel = [
    issue.location.address,
    issue.location.district,
    issue.city,
    issue.state,
  ]
    .filter(Boolean)
    .join(", ");

  const stages = buildLifecycleStages(issue);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12">
      {/* Breadcrumb */}
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

      {/* Issue Header: reference, wrapping badges, title, actions */}
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
            onClick={handleUpvote}
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
            onClick={handleShare}
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

      {/* Two-Column Content Area */}
      <div className="mt-7 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column (8/12): summary -> AI analysis -> evidence + location */}
        <div className="min-w-0 space-y-6 lg:col-span-8">
          {/* 1. Complaint Summary & Metadata */}
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

          {/* 2. Highlighted Gemini AI Analysis Breakdown */}
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

          {/* 3. Compact side-by-side Evidence & Location row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section
              aria-labelledby="photo-evidence-heading"
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 p-4 pb-3">
                <h2
                  id="photo-evidence-heading"
                  className="font-headline text-base font-bold text-[#0F172A]"
                >
                  Photo Evidence
                </h2>
                {hasResolutionProof && (
                  <span className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#065F46]">
                    Before &amp; After Resolution Proof
                  </span>
                )}
              </div>

              {hasResolutionProof && issue.completionReport ? (
                <div className="space-y-3 px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    <ZoomableEvidencePhoto
                      src={imageSrc}
                      alt={issue.photoAltText || issue.title}
                      triggerLabel="Enlarge photo evidence"
                      dialogTitle={`Before Photo — #${issue.referenceCode}`}
                      badgeText="Before"
                      heightClass="h-36"
                    />
                    <ZoomableEvidencePhoto
                      src={issue.completionReport.afterPhotoUrl}
                      alt={`After-repair proof for ${issue.title}`}
                      triggerLabel="Enlarge after-repair resolution proof"
                      dialogTitle={`After-Repair Resolution Proof — #${issue.referenceCode}`}
                      badgeText="After"
                      heightClass="h-36"
                    />
                  </div>
                  <div className="rounded-xl border border-[#99EFE5] bg-[#F0FDFA] p-3 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CompletionVerdictBadge
                        verdict={
                          issue.completionReport.aiVerification.verdict
                        }
                      />
                      <span className="font-bold tabular-nums text-[#0F766E]">
                        {issue.completionReport.aiVerification.confidence}% AI
                        Confidence
                      </span>
                    </div>
                    <p className="text-[#334155]">
                      {issue.completionReport.aiVerification.summary}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-4">
                  <ZoomableEvidencePhoto
                    src={imageSrc}
                    alt={issue.photoAltText || issue.title}
                    triggerLabel="Enlarge photo evidence"
                    dialogTitle={`Photo Evidence — #${issue.referenceCode}`}
                    heightClass="h-44"
                  />
                </div>
              )}

              <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs font-semibold text-[#0F766E]">
                {hasResolutionProof
                  ? "Before & After Field Repair Proof Logged"
                  : issue.photoUrl
                    ? "Photo Evidence Verified"
                    : "Civic Vector Reference"}
              </div>
            </section>

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
              <CivicMap
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

        {/* Right Column (4/12): sticky 4-stage timeline + Department & SLA */}
        <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:col-span-4">
          <section
            aria-labelledby="tracking-timeline-heading"
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
          >
            <h2
              id="tracking-timeline-heading"
              className="font-headline text-lg font-bold text-[#0F172A]"
            >
              Tracking Timeline
            </h2>
            <p className="mt-1 text-xs text-[#475569]">
              Timestamped municipal lifecycle: Reported → In Progress → Pending
              Verification → Resolved
            </p>

            <ol
              aria-label="Municipal lifecycle stages"
              className="relative mt-6 space-y-6 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-0.5 before:bg-[#E2E8F0]"
            >
              {stages.map((stage) => {
                const Icon = getStageIcon(stage.status);
                const stateLabel =
                  stage.state === "completed"
                    ? "Completed"
                    : stage.state === "current"
                      ? "Current"
                      : "Pending";
                return (
                  <li
                    key={stage.status}
                    data-stage={stage.status}
                    data-state={stage.state}
                    aria-current={stage.state === "current" ? "step" : undefined}
                    className="relative pl-11"
                  >
                    <span
                      className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        stage.state === "completed"
                          ? "border-[#065F46] bg-[#ECFDF5] text-[#065F46]"
                          : stage.state === "current"
                            ? "border-[#1B365D] bg-[#1B365D] text-white ring-4 ring-[#1B365D]/15"
                            : "border-dashed border-[#94A3B8] bg-white text-[#64748B]"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            stage.state === "pending"
                              ? "text-[#475569]"
                              : "text-[#0F172A]"
                          }`}
                        >
                          {stage.status}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            stage.state === "completed"
                              ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
                              : stage.state === "current"
                                ? "border-[#1B365D] bg-[#EFF6FF] text-[#1B365D]"
                                : "border-[#CBD5E1] bg-[#F8FAFC] text-[#475569]"
                          }`}
                        >
                          {stage.state === "completed" && (
                            <Check className="h-3 w-3" aria-hidden="true" />
                          )}
                          {stateLabel}
                        </span>
                      </div>

                      {stage.entries.length > 0 ? (
                        stage.entries.map((entry, idx) => (
                          <div
                            key={`${entry.timestamp}-${idx}`}
                            className="space-y-0.5"
                          >
                            <time
                              dateTime={entry.timestamp}
                              className="block text-[11px] font-medium text-[#64748B]"
                            >
                              {formatDateTime(entry.timestamp)}
                            </time>
                            <p className="text-xs leading-relaxed text-[#475569]">
                              {entry.note}
                            </p>
                            <p className="text-[11px] font-semibold text-[#64748B]">
                              Updated by: {entry.updatedBy}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#64748B]">
                          {stage.status === "In Progress"
                            ? "A municipal crew will be assigned and field progress will be logged here."
                            : stage.status === "Pending Verification"
                              ? "Field crew completion photo and Gemini AI before-vs-after verification will appear here awaiting Authority approval."
                              : "Final municipal resolution note will appear here once field work concludes."}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Building2
                className="h-5 w-5 text-[#1B365D]"
                aria-hidden="true"
              />
              <h2 className="font-headline text-base font-bold text-[#0F172A]">
                Department &amp; SLA
              </h2>
            </div>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[#64748B]">
                  Responsible Unit
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-[#0F172A]">
                  {issue.department}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[#64748B]">
                  Target Response SLA
                </dt>
                <dd className="mt-0.5 font-semibold text-[#0F766E]">
                  {slaTarget}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[#64748B]">
                  Public Reference ID
                </dt>
                <dd className="mt-0.5 font-mono font-semibold text-[#0F172A]">
                  {issue.referenceCode}
                </dd>
              </div>
            </dl>

            {user?.role === "authority" && (
              <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[11px] text-[#475569]">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]"
                  aria-hidden="true"
                />
                <span>
                  Authority action:{" "}
                  <Link
                    href="/admin"
                    className="font-semibold text-[#0369A1] underline"
                  >
                    Open in Authority Console
                  </Link>
                  .
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
