"use client";

import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flag,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { buildLifecycleStages } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/formatters";
import type { Issue, IssueStatus } from "@/types/issue";

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

interface LifecycleTimelineProps {
  issue: Issue;
  isAuthority: boolean;
}

export function LifecycleTimeline({
  issue,
  isAuthority,
}: LifecycleTimelineProps) {
  const stages = useMemo(() => buildLifecycleStages(issue), [issue]);

  const slaTarget =
    issue.priority === "Critical"
      ? "Immediate dispatch (< 4 hours)"
      : issue.priority === "High"
        ? "24–48 hours"
        : issue.priority === "Medium"
          ? "3–5 business days"
          : "7–14 business days";

  return (
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
                  className={`absolute top-0.5 left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
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
          <Building2 className="h-5 w-5 text-[#1B365D]" aria-hidden="true" />
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
            <dd className="mt-0.5 font-semibold text-[#0F766E]">{slaTarget}</dd>
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

        {isAuthority && (
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
  );
}
