"use client";

import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Flag,
  OctagonAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import type { Issue } from "@/types/issue";

export interface AdminQueueMetrics {
  critical: number;
  reported: number;
  inProgress: number;
  pendingVerification: number;
  resolved: number;
}

export interface AdminDecisionBanner {
  updated: string;
  decision?: "approved" | "rework";
}

interface AdminHeaderStripProps {
  displayName: string;
  metrics: AdminQueueMetrics;
  totalPendingApprovals: number;
  firstPendingIssue: Issue | null;
  decisionBanner: AdminDecisionBanner | null;
  onDismissBanner: () => void;
  onExportCsv: () => void;
}

export function AdminHeaderStrip({
  displayName,
  metrics,
  totalPendingApprovals,
  firstPendingIssue,
  decisionBanner,
  onDismissBanner,
  onExportCsv,
}: AdminHeaderStripProps) {
  const compactAdminStats = [
    {
      label: "Critical",
      value: metrics.critical,
      Icon: OctagonAlert,
      badgeClass: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
    },
    {
      label: "Reported",
      value: metrics.reported,
      Icon: Flag,
      badgeClass: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
    },
    {
      label: "In Progress",
      value: metrics.inProgress,
      Icon: Clock,
      badgeClass: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]",
    },
    {
      label: "Pending",
      value: metrics.pendingVerification,
      Icon: FileCheck2,
      badgeClass: "bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]",
    },
    {
      label: "Resolved",
      value: metrics.resolved,
      Icon: CheckCircle2,
      badgeClass: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#99EFE5] bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0F766E]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Municipal Authority: {displayName}
          </div>
          <h1 className="mt-2 font-headline text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            Authority Operations Console
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[#475569]">
            Prioritize regional dispatch queues by Gemini AI urgency score and
            verify field completion reports.
          </p>
        </div>

        <section
          aria-label="Operational queue summary"
          className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {compactAdminStats.map(({ label, value, Icon, badgeClass }) => (
              <div
                key={label}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 ${badgeClass}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="text-[11px] font-semibold">{label}</span>
                <span className="font-headline text-sm font-bold tabular-nums">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <span
            className="hidden h-6 w-px bg-[#E2E8F0] sm:inline-block"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={onExportCsv}
            aria-label="Export CSV"
            className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </button>
        </section>
      </div>

      {decisionBanner && (
        <section
          role="status"
          aria-live="polite"
          className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            decisionBanner.decision === "rework"
              ? "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"
              : "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {decisionBanner.decision === "rework"
                ? `Rework requested for #${decisionBanner.updated}. Task returned to the Field Worker queue.`
                : `Completion approved for #${decisionBanner.updated}. Issue is now marked Resolved on the public feed.`}
            </span>
          </div>
          <button
            type="button"
            onClick={onDismissBanner}
            aria-label="Dismiss notification"
            className="rounded-md p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      )}

      {totalPendingApprovals > 0 && firstPendingIssue && (
        <section
          role="status"
          aria-label="Pending approval notifications"
          className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-[#DDD6FE] bg-[#F5F3FF] p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B21B6] text-white">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">
                {totalPendingApprovals} Field Work{" "}
                {totalPendingApprovals === 1 ? "Completion" : "Completions"}{" "}
                Awaiting Authority Approval
              </p>
              <p className="mt-0.5 text-xs text-[#475569]">
                Field crews submitted after-repair proof verified by Gemini AI.
                Review Before-vs-After photos on the dedicated approval screen.
              </p>
            </div>
          </div>

          <Link
            href={`/admin/review/${firstPendingIssue.id}`}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#4C1D95] sm:self-center"
          >
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
            Review Pending Approvals
          </Link>
        </section>
      )}
    </>
  );
}
