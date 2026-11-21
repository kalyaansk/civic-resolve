"use client";

import {
  AlertCircle,
  Camera,
  Clock,
  Loader2,
  Play,
  Send,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
} from "@/lib/security/imageValidation";
import type { CompletionVerification, Issue } from "@/types/issue";

const WORKER_QUICK_NOTES = [
  "Hazard cleared and area secured",
  "Damaged component replaced and tested",
  "Surface repaired and site cleaned",
] as const;

interface WorkerProofFormProps {
  issue: Issue;
  getAuthHeaders: () => Promise<Record<string, string>>;
  onIssueUpdated: (updated: Issue) => void;
}

export function WorkerProofForm({
  issue,
  getAuthHeaders,
  onIssueUpdated,
}: WorkerProofFormProps) {
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [startingWork, setStartingWork] = useState(false);
  const [startFeedback, setStartFeedback] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

      onIssueUpdated(data.issue);
      setStartFeedback(
        `On-site work started for #${data.issue.referenceCode}. Status updated to In Progress.`,
      );
    } catch {
      setSubmitError(
        "Network error while starting work order. Please try again.",
      );
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

      onIssueUpdated(data.issue);
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

  return (
    <div className="mt-6 space-y-6">
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
              aria-describedby={photoError ? "worker-photo-error" : undefined}
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
              <div className="flex min-w-0 items-center gap-3">
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
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
  );
}
