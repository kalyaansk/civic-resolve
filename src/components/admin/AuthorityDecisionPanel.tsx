"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { IssueStatus } from "@/types/issue";

const MAX_NOTE_LENGTH = 1000;

const AUTHORITY_QUICK_NOTES = [
  "Verified before-and-after repair evidence; approved for public closure.",
  "Repair meets municipal safety standards; issue resolved.",
  "After photo does not clearly verify hazard clearance; please re-inspect and re-upload.",
] as const;

interface AuthorityDecisionPanelProps {
  status: IssueStatus;
  resolutionNote: string;
  onResolutionNoteChange: (value: string) => void;
  submittingDecision: "approve" | "reject" | null;
  errorMessage: string | null;
  onDecision: (decision: "approve" | "reject") => Promise<void>;
}

export function AuthorityDecisionPanel({
  status,
  resolutionNote,
  onResolutionNoteChange,
  submittingDecision,
  errorMessage,
  onDecision,
}: AuthorityDecisionPanelProps) {
  return (
    <section
      aria-label="Authority approval decision"
      className="mt-6 rounded-2xl border-2 border-[#CBD5E1] bg-white p-6 shadow-md"
    >
      <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
        <ShieldCheck className="h-5 w-5 text-[#1B365D]" aria-hidden="true" />
        <h2>Authority Approval Decision</h2>
      </div>

      {status !== "Pending Verification" ? (
        <div className="mt-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm text-[#1E40AF]">
          <p className="font-semibold">
            This issue is currently marked as <strong>{status}</strong>.
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
                  onClick={() => onResolutionNoteChange(template)}
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
              onChange={(e) => onResolutionNoteChange(e.target.value)}
              placeholder="Add an official closing note for citizens or specific rework instructions for the field crew..."
              className="mt-2 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm leading-relaxed text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={submittingDecision !== null}
              onClick={() => void onDecision("approve")}
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
              onClick={() => void onDecision("reject")}
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
  );
}
