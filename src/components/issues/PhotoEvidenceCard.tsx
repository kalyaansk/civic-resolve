"use client";

import { Maximize2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CompletionVerdictBadge } from "@/components/ui/IssueBadges";
import {
  PhotoZoomDialog,
  type ZoomPhotoPayload,
} from "@/components/ui/PhotoZoomDialog";
import { isInlineOrSvgUrl } from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

interface PhotoEvidenceCardProps {
  issue: Issue;
  imageSrc: string;
}

function EvidenceThumbnailButton({
  src,
  alt,
  triggerLabel,
  badgeText,
  heightClass = "h-44",
  onOpen,
}: {
  src: string;
  alt: string;
  triggerLabel: string;
  badgeText?: string;
  heightClass?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={triggerLabel}
      className={`group relative block ${heightClass} w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        loading="lazy"
        decoding="async"
        unoptimized={isInlineOrSvgUrl(src)}
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      {badgeText && (
        <span className="absolute top-2 left-2 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F172A] shadow-xs">
          {badgeText}
        </span>
      )}
      <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1B365D] shadow-sm">
        <Maximize2 className="h-3 w-3" aria-hidden="true" />
        Click to enlarge
      </span>
    </button>
  );
}

export function PhotoEvidenceCard({ issue, imageSrc }: PhotoEvidenceCardProps) {
  const [zoomPhoto, setZoomPhoto] = useState<ZoomPhotoPayload | null>(null);
  const hasResolutionProof = Boolean(issue.completionReport?.afterPhotoUrl);
  const beforeAlt = issue.photoAltText || issue.title;

  return (
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
            <EvidenceThumbnailButton
              src={imageSrc}
              alt={beforeAlt}
              triggerLabel="Enlarge photo evidence"
              badgeText="Before"
              heightClass="h-36"
              onOpen={() =>
                setZoomPhoto({
                  src: imageSrc,
                  label: `Before Photo — #${issue.referenceCode}`,
                  alt: beforeAlt,
                  description: beforeAlt,
                })
              }
            />
            <EvidenceThumbnailButton
              src={issue.completionReport.afterPhotoUrl}
              alt={`After-repair proof for ${issue.title}`}
              triggerLabel="Enlarge after-repair resolution proof"
              badgeText="After"
              heightClass="h-36"
              onOpen={() =>
                setZoomPhoto({
                  src: issue.completionReport!.afterPhotoUrl,
                  label: `After-Repair Resolution Proof — #${issue.referenceCode}`,
                  alt: `After-repair proof for ${issue.title}`,
                  description: `After-repair proof for ${issue.title}`,
                })
              }
            />
          </div>
          <div className="space-y-1 rounded-xl border border-[#99EFE5] bg-[#F0FDFA] p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CompletionVerdictBadge
                verdict={issue.completionReport.aiVerification.verdict}
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
          <EvidenceThumbnailButton
            src={imageSrc}
            alt={beforeAlt}
            triggerLabel="Enlarge photo evidence"
            heightClass="h-44"
            onOpen={() =>
              setZoomPhoto({
                src: imageSrc,
                label: `Photo Evidence — #${issue.referenceCode}`,
                alt: beforeAlt,
                description: beforeAlt,
              })
            }
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

      <PhotoZoomDialog
        photo={zoomPhoto}
        onClose={() => setZoomPhoto(null)}
        closeAriaLabel="Close photo viewer"
      />
    </section>
  );
}
