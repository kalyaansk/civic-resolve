"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Loader2,
  Lock,
  MapPin,
  Play,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wrench,
  X,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CompletionVerdictBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/Badges";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
} from "@/lib/security/imageValidation";
import { buildGoogleMapsUrl, formatDateTime } from "@/lib/utils";
import type { CompletionVerification, Issue } from "@/types/issue";

interface WorkerTaskDetailProps {
  initialIssue: Issue;
}

const WORKER_QUICK_NOTES = [
  "Hazard cleared and area secured",
  "Damaged component replaced and tested",
  "Surface repaired and site cleaned",
] as const;

function isInlineOrSvgUrl(src: string): boolean {
  return (
    src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg")
  );
}

export function WorkerTaskDetail({ initialIssue }: WorkerTaskDetailProps) {
  const {
    user,
    loading,
    demoEnabled,
    signInDemoWorker,
    getAuthHeaders,
    openSignInDialog,
  } = useAuth();

  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [startingWork, setStartingWork] = useState(false);
  const [startFeedback, setStartFeedback] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<{
    src: string;
    label: string;
    alt: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isWorker = user?.role === "worker";

  useEffect(() => {
    return () => {
      if (afterPreviewUrl) {
        URL.revokeObjectURL(afterPreviewUrl);
      }
    };
  }, [afterPreviewUrl]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    setSubmitError(null);
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setPhotoError("Select 1 after-repair proof photo only (max 5 MB).");
      return;
    }

    const file = files[0]!;
    if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      setPhotoError("Unsupported format. Upload a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoError("Photo exceeds the 5 MB limit. Choose a smaller file.");
      return;
    }

    if (afterPreviewUrl) {
      URL.revokeObjectURL(afterPreviewUrl);
    }
    setAfterPhotoFile(file);
    setAfterPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (afterPreviewUrl) {
      URL.revokeObjectURL(afterPreviewUrl);
    }
    setAfterPhotoFile(null);
    setAfterPreviewUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleQuickFill = (template: string) => {
    setNoteError(null);
    setSubmitError(null);
    const sentence = `${template}.`;
    setCompletionNote((prev) => {
      const trimmed = prev.trim();
      if (trimmed.includes(sentence)) return prev;
      return trimmed ? `${trimmed} ${sentence}` : sentence;
    });
  };

  const handleStartWork = async () => {
    setStartingWork(true);
    setSubmitError(null);
    setStartFeedback(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/issues/${issue.id}/worker-action`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ action: "start" }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        issue?: Issue;
        error?: string;
      };

      if (!res.ok || !data.issue) {
        setSubmitError(data.error || "Unable to start on-site work.");
        return;
      }

      setIssue(data.issue);
      setStartFeedback(
        `On-site work started for #${data.issue.referenceCode}. Status updated to In Progress.`,
      );
    } catch {
      setSubmitError("Network error while starting work order. Please try again.");
    } finally {
      setStartingWork(false);
    }
  };

  const handleSubmitProof = async (event: FormEvent) => {
    event.preventDefault();
    setPhotoError(null);
    setNoteError(null);
    setSubmitError(null);

    let hasClientError = false;
    if (!afterPhotoFile) {
      setPhotoError(
        "After-Repair Proof Photo is required (JPEG, PNG, or WebP, max 5 MB).",
      );
      hasClientError = true;
    }
    if (completionNote.trim().length < 10) {
      setNoteError(
        "Please enter a work completion summary of at least 10 characters.",
      );
      hasClientError = true;
    }
    if (hasClientError) {
      setSubmitError(
        "Please fix the highlighted fields above before submitting for Gemini AI verification.",
      );
      return;
    }

    setSubmittingProof(true);
    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append("afterPhoto", afterPhotoFile!);
      formData.append("completionNote", completionNote.trim());

      const res = await fetch(`/api/issues/${issue.id}/worker-action`, {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: formData,
      });

      const data = (await res.json().catch(() => ({}))) as {
        issue?: Issue;
        completionVerification?: CompletionVerification;
        error?: string;
      };

      if (!res.ok || !data.issue) {
        setSubmitError(
          data.error ||
            "Failed to submit completion proof for Gemini AI verification.",
        );
        return;
      }

      setIssue(data.issue);
      handleRemovePhoto();
      setCompletionNote("");
    } catch {
      setSubmitError(
        "Network error while uploading completion proof. Please try again.",
      );
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-12">
        <p className="text-sm font-medium text-[#475569]">
          Verifying Field Worker session...
        </p>
      </div>
    );
  }

  if (user && !isWorker) {
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
            403 Restricted — Field Workers Only
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            You are signed in as{" "}
            <strong>
              {user.role === "authority" ? "Municipal Authority" : "Citizen"}
            </strong>{" "}
            ({user.displayName}). Task execution and after-repair proof uploads
            are restricted to Field Crew accounts.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user.role === "authority" ? "/admin" : "/"}
              className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
            >
              {user.role === "authority"
                ? "Go to Authority Console"
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#92400E] text-white">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#0F172A]">
                Field Worker Authentication Required
              </h1>
              <p className="text-sm text-[#475569]">
                Sign in as a Field Worker to execute task #{issue.referenceCode}
                .
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {demoEnabled && (
              <button
                type="button"
                onClick={() => void signInDemoWorker()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#92400E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#78350F]"
              >
                <Wrench className="h-4 w-4" aria-hidden="true" />
                Demo Field Worker Login
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                openSignInDialog({
                  tab: "worker",
                  mode: "signin",
                  returnTo: `/worker/tasks/${issue.id}`,
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              Official Worker Sign-In
            </button>
          </div>
        </section>
      </div>
    );
  }

  const beforeSrc = issue.photoUrl || "/images/issues/pothole.svg";
  const fullAddress = [
    issue.location.address,
    issue.location.district,
    issue.city,
    issue.state,
  ]
    .filter(Boolean)
    .join(", ");

  const isCompletedByWorker =
    issue.status === "Pending Verification" || issue.status === "Resolved";
  const completionReport = issue.completionReport ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-12">
      {/* Top Bar */}
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

      {/* Top Section — Issue Details */}
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
                unoptimized={isInlineOrSvgUrl(beforeSrc)}
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <span className="absolute top-2.5 left-2.5 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F172A] shadow-xs">
                Before Photo
              </span>
              <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                <ZoomIn className="h-3 w-3" aria-hidden="true" />
                Zoom
              </span>
            </button>
          </div>

          <div className="space-y-3 md:col-span-7">
            <p className="text-sm leading-relaxed text-[#334155]">
              {issue.description}
            </p>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs space-y-2">
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

      {/* Active Task Flow: Step 1 (Work Status) + Step 2 (Submit Proof) */}
      {!isCompletedByWorker ? (
        <div className="mt-6 space-y-6">
          {/* Step 1 — Work Status */}
          <section
            aria-label="Step 1: Work Status"
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Step 1 — On-Site Work Status
                </p>
                <h2 className="mt-1 font-headline text-lg font-bold text-[#0F172A]">
                  {issue.status === "Reported"
                    ? "Start On-Site Repair Work"
                    : "Work In Progress"}
                </h2>
                <p className="mt-0.5 text-xs text-[#475569]">
                  {issue.status === "Reported"
                    ? "Log your crew arrival to move this complaint to In Progress on the public tracking timeline."
                    : "Your field crew is actively working on this repair. Complete Step 2 below once finished."}
                </p>
              </div>

              {issue.status === "Reported" ? (
                <button
                  type="button"
                  disabled={startingWork}
                  onClick={() => void handleStartWork()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1B365D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#002046] disabled:opacity-60"
                >
                  {startingWork ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Starting Work...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" aria-hidden="true" />
                      Start On-Site Work
                    </>
                  )}
                </button>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2.5 text-xs font-bold text-[#065F46]">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Work In Progress
                </span>
              )}
            </div>

            {startFeedback && (
              <p
                role="status"
                aria-live="polite"
                className="mt-3 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3.5 py-2 text-xs font-semibold text-[#065F46]"
              >
                {startFeedback}
              </p>
            )}
          </section>

          {/* Step 2 — Submit Proof & Generate Gemini AI Report */}
          <form
            onSubmit={handleSubmitProof}
            noValidate
            aria-label="Step 2: Submit Completion Proof"
            className="space-y-5 rounded-2xl border-2 border-[#CBD5E1] bg-white p-6 shadow-md"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                Step 2 — Submit Proof &amp; Generate Gemini AI Report
              </p>
              <h2 className="mt-1 font-headline text-lg font-bold text-[#0F172A]">
                Upload After-Repair Photo &amp; Completion Summary
              </h2>
              <p className="mt-0.5 text-xs text-[#475569]">
                Gemini AI compares your After photo against the original citizen
                complaint photo and forwards the verified report directly to the
                Municipal Authority for final approval.
              </p>
            </div>

            {/* After-Repair Proof Photo Dropzone */}
            <div className="space-y-2.5">
              <label
                htmlFor="worker-after-photo"
                className="block text-sm font-semibold text-[#0F172A]"
              >
                After-Repair Proof Photo <span className="text-[#991B1B]">*</span>
              </label>

              <div
                className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                  photoError
                    ? "border-[#FCA5A5] bg-[#FEF2F2]"
                    : "border-[#99EFE5] bg-[#F0FDFA]/60 hover:border-[#0F766E]"
                }`}
              >
                <Camera
                  className="mx-auto h-7 w-7 text-[#0F766E]"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                  Attach clear photo showing the completed repair
                </p>
                <p className="mt-0.5 text-xs text-[#475569]">
                  JPEG, PNG, WebP · Max 5 MB
                </p>
                <input
                  ref={fileInputRef}
                  id="worker-after-photo"
                  name="afterPhoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  aria-invalid={Boolean(photoError)}
                  aria-describedby={
                    photoError ? "worker-photo-error" : undefined
                  }
                  className="mt-3 block w-full cursor-pointer text-xs text-[#475569] file:mr-3 file:rounded-lg file:border file:border-[#0F766E] file:bg-white file:px-4 file:py-2 file:text-xs font-semibold file:text-[#0F766E] hover:file:bg-[#CCFBF1]"
                />
              </div>

              {photoError && (
                <p
                  id="worker-photo-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#991B1B]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {photoError}
                </p>
              )}

              {afterPhotoFile && afterPreviewUrl && (
                <div className="flex flex-col gap-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-[#A7F3D0] bg-white">
                      <Image
                        src={afterPreviewUrl}
                        alt={`Preview of ${afterPhotoFile.name}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#0F172A]">
                        {afterPhotoFile.name}
                      </p>
                      <p className="text-[11px] font-medium text-[#065F46]">
                        {(afterPhotoFile.size / 1024).toFixed(0)} KB • Ready for
                        Gemini Before-vs-After Verification
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-[#065F46] bg-white px-3 py-1.5 text-xs font-semibold text-[#065F46] hover:bg-[#D1FAE5]"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      aria-label="Remove after-repair photo"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#FECACA] bg-white px-3 py-1.5 text-xs font-semibold text-[#991B1B] hover:bg-[#FEF2F2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Work Completion Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="worker-completion-note"
                  className="block text-sm font-semibold text-[#0F172A]"
                >
                  Work Completion Summary{" "}
                  <span className="text-[#991B1B]">*</span>
                </label>
                <span className="text-xs font-medium tabular-nums text-[#64748B]">
                  {completionNote.length} / 1,000
                </span>
              </div>

              <div
                role="group"
                aria-label="Quick-fill completion summary templates"
                className="flex flex-wrap gap-1.5"
              >
                {WORKER_QUICK_NOTES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => handleQuickFill(template)}
                    className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
                  >
                    + {template}
                  </button>
                ))}
              </div>

              <textarea
                id="worker-completion-note"
                name="completionNote"
                rows={4}
                maxLength={1000}
                value={completionNote}
                onChange={(e) => {
                  setCompletionNote(e.target.value);
                  if (noteError && e.target.value.trim().length >= 10) {
                    setNoteError(null);
                  }
                }}
                aria-invalid={Boolean(noteError)}
                aria-describedby={noteError ? "worker-note-error" : undefined}
                placeholder="Describe the repair completed, parts replaced, safety checks performed, and site cleanup..."
                className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed text-[#0F172A] placeholder:text-[#64748B] focus:bg-white ${
                  noteError
                    ? "border-[#FCA5A5] bg-[#FEF2F2]"
                    : "border-[#CBD5E1] bg-[#F8FAFC]"
                }`}
              />

              {noteError && (
                <p
                  id="worker-note-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#991B1B]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {noteError}
                </p>
              )}
            </div>

            {/* Inline Submit Error directly above button */}
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#991B1B]"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingProof}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#115E59] disabled:opacity-60"
            >
              {submittingProof ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Analyzing Before vs. After photos with Gemini AI...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Submit &amp; Generate Gemini AI Report
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Step 3 — Generated AI Report Confirmation */
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
                {issue.status === "Resolved"
                  ? "Approved & Resolved by Municipal Authority"
                  : "Completion Proof Analyzed & Submitted"}
              </h2>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3.5 py-1.5 text-xs font-bold sm:self-center ${
                issue.status === "Resolved"
                  ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
                  : "border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6]"
              }`}
            >
              {issue.status === "Resolved" ? (
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
                      unoptimized={isInlineOrSvgUrl(
                        completionReport.afterPhotoUrl,
                      )}
                      sizes="(max-width: 768px) 100vw, 45vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#99EFE5] bg-white p-4 space-y-2">
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
      )}

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
