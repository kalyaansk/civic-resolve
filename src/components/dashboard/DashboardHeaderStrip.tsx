"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Flag,
} from "lucide-react";
import type { DashboardStats } from "@/types/issue";

interface DashboardHeaderStripProps {
  stats: DashboardStats;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export function DashboardHeaderStrip({
  stats,
  onExportCsv,
  onExportJson,
}: DashboardHeaderStripProps) {
  const compactStats = [
    {
      label: "Total",
      value: stats.total,
      Icon: ClipboardList,
      badgeClass: "bg-[#EFF6FF] text-[#1B365D] border-[#BFDBFE]",
    },
    {
      label: "Reported",
      value: stats.reported,
      Icon: Flag,
      badgeClass: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      Icon: Clock,
      badgeClass: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      Icon: CheckCircle2,
      badgeClass: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#99EFE5] bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0F766E]">
          <span
            className="h-2 w-2 rounded-full bg-[#0F766E]"
            aria-hidden="true"
          />
          Live Municipal Feed • Open311 Transparency
        </div>
        <h1 className="mt-2 font-headline text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
          Public Issue Tracking Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#475569]">
          Track neighborhood infrastructure reports across Indian cities,
          powered by Gemini AI Multimodal Triage and verified resolutions.
        </p>
      </div>

      <section
        aria-label="Civic overview summary and exports"
        className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {compactStats.map(({ label, value, Icon, badgeClass }) => (
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onExportCsv}
            aria-label="Export CSV"
            className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            onClick={onExportJson}
            aria-label="Export JSON"
            className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            JSON
          </button>
        </div>
      </section>
    </div>
  );
}
