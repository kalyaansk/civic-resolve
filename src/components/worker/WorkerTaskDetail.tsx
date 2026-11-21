"use client";

import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPin,
  Sparkles,
  Wrench,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleAccessGate } from "@/components/auth/RoleAccessGate";
import { PriorityBadge, StatusBadge } from "@/components/ui/IssueBadges";
import {
  PhotoZoomDialog,
  type ZoomPhotoPayload,
} from "@/components/ui/PhotoZoomDialog";
import { WorkerProofForm } from "@/components/worker/WorkerProofForm";
import { WorkerVerificationSummary } from "@/components/worker/WorkerVerificationSummary";
import {
  buildGoogleMapsUrl,
  formatFullAddress,
  isInlineOrSvgUrl,
} from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

interface WorkerTaskDetailProps {
  initialIssue: Issue;
}

export function WorkerTaskDetail({ initialIssue }: WorkerTaskDetailProps) {
  const { user, loading, getAuthHeaders } = useAuth();
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [zoomPhoto, setZoomPhoto] = useState<ZoomPhotoPayload | null>(null);

  if (loading || !user || user.role !== "worker") {
    return (
      <RoleAccessGate
        requiredRole="worker"
        returnTo={`/worker/tasks/${issue.id}`}
        authSubtitle={`Sign in as a Field Worker to execute task #${issue.referenceCode}.`}
        forbiddenDescription="Task execution and after-repair proof uploads are restricted to Field Crew accounts."
      />
    );
  }

  const beforeSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const fullAddress = formatFullAddress(issue);
  const isCompletedByWorker =
    issue.status === "Pending Verification" || issue.status === "Resolved";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/worker"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#1B365D] shadow-xs transition-colors hover:bg-[#F1F5F9]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Field Tasks
        </Link>

        <Link
          href={`/issues/${issue.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0369A1] hover:underline"
        >
          View Public Issue Page ↗
        </Link>
      </div>

      <section className="mt-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-xs font-bold text-[#92400E]">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            Field Task Execution
          </span>
          <span className="font-mono text-xs font-bold text-[#1B365D]">
            #{issue.referenceCode}
          </span>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#0F766E]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Urgency {issue.urgencyScore} / 100
          </span>
        </div>

        <h1 className="mt-3 font-headline text-2xl font-bold tracking-tight text-[#0F172A]">
          {issue.title}
        </h1>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-5">
            <button
              type="button"
              onClick={() =>
                setZoomPhoto({
                  src: beforeSrc,
                  label: "Original Citizen Complaint Photo",
                  alt: issue.photoAltText || issue.title,
                })
              }
              aria-label="Zoom original complaint photo"
              className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#F1F5F9]"
            >
              <Image
                src={beforeSrc}
                alt={issue.photoAltText || issue.title}
                fill
                decoding="async"
                unoptimized={isInlineOrSvgUrl(beforeSrc)}
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <span className="absolute top-2.5 left-2.5 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F172A] shadow-xs">
                Before Photo
              </span>
              <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                <ZoomIn className="h-3 w-3" aria-hidden="true" />
                Zoom
              </span>
            </button>
          </div>

          <div className="space-y-3 md:col-span-7">
            <p className="text-sm leading-relaxed text-[#334155]">
              {issue.description}
            </p>

            <div className="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs">
              <div className="flex items-start gap-2 font-semibold text-[#0F172A]">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#0369A1]"
                  aria-hidden="true"
                />
                <span>{fullAddress}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <a
                  href={buildGoogleMapsUrl(
                    issue.location.lat,
                    issue.location.lng,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF] hover:bg-[#DBEAFE]"
                >
                  Open in Google Maps (Directions)
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <span className="inline-flex items-center gap-1 font-semibold text-[#1B365D]">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {issue.department}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#99EFE5] bg-[#F0FDFA] p-3.5 text-xs">
              <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#0F766E]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Gemini AI Field Guidance
              </p>
              <p className="mt-1 leading-relaxed text-[#334155]">
                {issue.aiAnalysis.reasoning}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!isCompletedByWorker ? (
        <WorkerProofForm
          issue={issue}
          getAuthHeaders={getAuthHeaders}
          onIssueUpdated={setIssue}
        />
      ) : (
        <WorkerVerificationSummary issue={issue} beforeSrc={beforeSrc} />
      )}

      <PhotoZoomDialog photo={zoomPhoto} onClose={() => setZoomPhoto(null)} />
    </div>
  );
}
