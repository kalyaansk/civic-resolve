import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flag,
  MinusCircle,
  OctagonAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CompletionVerdict,
  IssuePriority,
  IssueStatus,
} from "@/types/issue";

/**
 * WCAG 2.1 AA non-color badges: every status, priority, and AI verdict always
 * pairs a distinct icon with explicit high-contrast text.
 */

export const STATUS_STYLES: Record<
  IssueStatus,
  {
    bg: string;
    border: string;
    text: string;
    Icon: typeof Flag;
  }
> = {
  Reported: {
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
    text: "text-[#1E40AF]",
    Icon: Flag,
  },
  "In Progress": {
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    text: "text-[#92400E]",
    Icon: Clock,
  },
  "Pending Verification": {
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
    text: "text-[#5B21B6]",
    Icon: FileCheck2,
  },
  Resolved: {
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    Icon: CheckCircle2,
  },
};

export const PRIORITY_STYLES: Record<
  IssuePriority,
  {
    bg: string;
    border: string;
    text: string;
    Icon: typeof OctagonAlert;
  }
> = {
  Critical: {
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    Icon: OctagonAlert,
  },
  High: {
    bg: "bg-[#FFF7ED]",
    border: "border-[#FED7AA]",
    text: "text-[#9A3412]",
    Icon: AlertTriangle,
  },
  Medium: {
    bg: "bg-[#FEFCE8]",
    border: "border-[#FEF08A]",
    text: "text-[#854D0E]",
    Icon: MinusCircle,
  },
  Low: {
    bg: "bg-[#F1F5F9]",
    border: "border-[#CBD5E1]",
    text: "text-[#334155]",
    Icon: ArrowDown,
  },
};

export const VERDICT_STYLES: Record<
  CompletionVerdict,
  {
    bg: string;
    border: string;
    text: string;
    Icon: typeof CheckCircle2;
  }
> = {
  "Verified Fixed": {
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#065F46]",
    Icon: CheckCircle2,
  },
  "Partially Fixed": {
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    text: "text-[#92400E]",
    Icon: AlertTriangle,
  },
  "Needs Re-Inspection": {
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    Icon: OctagonAlert,
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: IssueStatus;
  className?: string;
}) {
  const { bg, border, text, Icon } =
    STATUS_STYLES[status] ?? STATUS_STYLES.Reported;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        bg,
        border,
        text,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{status || "Reported"}</span>
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: IssuePriority;
  className?: string;
}) {
  const { bg, border, text, Icon } =
    PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        bg,
        border,
        text,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{priority || "Medium"}</span>
    </span>
  );
}

export function AIDepartmentBadge({
  department,
  className,
}: {
  department: string;
  className?: string;
}) {
  return (
    <span
      title={`AI recommended department: ${department}`}
      className={cn(
        "inline-flex max-w-full items-start gap-1.5 rounded-2xl border border-[#99EFE5] bg-[#F0FDFA] px-2.5 py-1 text-xs font-semibold leading-snug text-[#0F766E]",
        className,
      )}
    >
      <Sparkles className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">AI: {department}</span>
    </span>
  );
}

export function CompletionVerdictBadge({
  verdict,
  className,
}: {
  verdict: CompletionVerdict;
  className?: string;
}) {
  const { bg, border, text, Icon } =
    VERDICT_STYLES[verdict] ?? VERDICT_STYLES["Needs Re-Inspection"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        bg,
        border,
        text,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{verdict || "Needs Re-Inspection"}</span>
    </span>
  );
}

export function UrgencyMeter({
  score,
  label = "Urgency Score",
}: {
  score: number;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(1, Math.round(score)));
  const barColor =
    clamped >= 90
      ? "bg-[#991B1B]"
      : clamped >= 70
        ? "bg-[#C2410C]"
        : clamped >= 40
          ? "bg-[#A16207]"
          : "bg-[#0F766E]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#475569]">{label}</span>
        <span className="font-bold tabular-nums text-[#0F172A]">
          {clamped} / 100
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={1}
        aria-valuemax={100}
        className="h-2.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            barColor,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] font-medium text-[#64748B]">
        <span>Low (1–39)</span>
        <span>Med (40–69)</span>
        <span>High (70–89)</span>
        <span>Crit (90+)</span>
      </div>
    </div>
  );
}
