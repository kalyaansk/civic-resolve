import {
  AlertTriangle,
  Building2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import { PriorityBadge, UrgencyMeter } from "@/components/ui/IssueBadges";
import type { AIAnalysis } from "@/types/issue";

interface GeminiTriageCardProps {
  analysis: AIAnalysis | null;
  analyzing: boolean;
  onRefreshPreview?: () => void;
  canRefresh?: boolean;
}

export function GeminiTriageCard({
  analysis,
  analyzing,
  onRefreshPreview,
  canRefresh = false,
}: GeminiTriageCardProps) {
  const isRejected = Boolean(
    analysis &&
      (analysis.isValidCivicIssue === false ||
        analysis.promptInjectionDetected === true),
  );

  return (
    <aside
      aria-label="Gemini AI Multimodal Triage"
      aria-live="polite"
      className={`rounded-2xl border p-6 shadow-md ${
        isRejected
          ? "border-[#FECACA] bg-gradient-to-b from-[#FEF2F2] via-white to-white"
          : "border-[#99EFE5] bg-gradient-to-b from-[#F0FDFA] via-white to-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-xs ${
              isRejected ? "bg-[#991B1B]" : "bg-[#0F766E]"
            }`}
          >
            {isRejected ? (
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <h2 className="font-headline text-lg font-bold text-[#0F172A]">
              Gemini AI Triage
            </h2>
            <p className="text-xs font-medium text-[#475569]">
              Gemini AI Multimodal Triage
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            isRejected
              ? "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]"
              : "border-[#99EFE5] bg-[#CCFBF1] text-[#0F766E]"
          }`}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Analyzing
            </>
          ) : isRejected ? (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#991B1B]"
                aria-hidden="true"
              />
              Blocked / Off-Topic
            </>
          ) : analysis ? (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#0F766E]"
                aria-hidden="true"
              />
              {analysis.source === "gemini" ? "Live Gemini AI" : "Smart Fallback"}
            </>
          ) : (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#64748B]"
                aria-hidden="true"
              />
              Awaiting Input
            </>
          )}
        </span>
      </div>

      {!analysis ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-dashed border-[#99EFE5] bg-white/80 p-5 text-center">
            <Sparkles
              className="mx-auto h-7 w-7 text-[#0F766E]"
              aria-hidden="true"
            />
            <p className="mt-2.5 text-sm font-semibold text-[#0F172A]">
              Ready for Live Analysis
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#475569]">
              Enter a title, description, or photo to run live Gemini AI Triage.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[11px] text-[#475569]">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]"
              aria-hidden="true"
            />
            <span>
              Gemini evaluates hazard severity, calculates an urgency score
              (1–100), and recommends the responsible municipal department.
            </span>
          </div>
        </div>
      ) : isRejected ? (
        <div className="mt-5 space-y-4">
          <div
            role="alert"
            className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-[#991B1B]"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-sm font-bold text-[#991B1B]">
                  Off-Topic or Invalid Civic Report Detected
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#7F1D1D]">
                  {analysis.rejectionReason ||
                    "This submission does not describe a valid civic infrastructure or public safety issue and cannot be scored or dispatched."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-xs leading-relaxed text-[#92400E]">
            <p className="font-semibold text-[#78350F]">
              How to submit a valid civic report:
            </p>
            <p className="mt-1">
              Describe a real municipal issue such as a road pothole, broken
              streetlight, water pipe leak, overflowing garbage bin, clogged
              storm drain, or damaged park equipment, along with its exact
              location.
            </p>
          </div>

          {onRefreshPreview && (
            <button
              type="button"
              onClick={onRefreshPreview}
              disabled={analyzing || !canRefresh}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {analyzing ? "Re-checking Report..." : "Re-run Gemini AI Check"}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              AI-Detected Category
            </span>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                <Tag className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                {analysis.category}
              </span>
              <span className="rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#1E40AF]">
                {analysis.confidence}% confidence
              </span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#475569]">
                Severity Classification
              </span>
              <PriorityBadge priority={analysis.priority} />
            </div>
            <UrgencyMeter score={analysis.urgencyScore} label="Urgency Score" />
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Recommended Municipal Department
            </span>
            <div className="mt-1.5 flex items-start gap-2.5 rounded-xl border border-[#E2E8F0] bg-white p-3.5">
              <Building2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#1B365D]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  {analysis.recommendedDepartment}
                </p>
                <p className="mt-0.5 text-xs text-[#475569]">
                  {analysis.estimatedImpact}
                </p>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Triage Rationale
            </span>
            <div className="mt-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs leading-relaxed text-[#334155]">
              {analysis.reasoning}
            </div>
          </div>

          {onRefreshPreview && (
            <button
              type="button"
              onClick={onRefreshPreview}
              disabled={analyzing || !canRefresh}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#0F766E] bg-white px-4 py-2 text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#F0FDFA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {analyzing ? "Running Gemini AI Triage..." : "Refresh Gemini AI Triage"}
            </button>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[11px] text-[#475569]">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]"
              aria-hidden="true"
            />
            <span>
              High and Critical reports are flagged immediately in the municipal
              authority queue for dispatch review.
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
