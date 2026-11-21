"use client";

import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/ui/IssueBadges";
import type { Issue } from "@/types/issue";

interface AdminQueueTableProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
}

export function AdminQueueTable({
  issues,
  selectedIssueId,
  onSelectIssue,
}: AdminQueueTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-xs">
        <caption className="sr-only">
          Urgency-sorted complaint queue. Select a row to open it in the
          Operations Inspector.
        </caption>
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
            <th scope="col" className="px-4 py-3.5">
              Urgency &amp; Priority
            </th>
            <th scope="col" className="px-4 py-3.5">
              Complaint &amp; Location
            </th>
            <th scope="col" className="min-w-[10rem] px-4 py-3.5">
              Department
            </th>
            <th scope="col" className="px-4 py-3.5">
              Status
            </th>
            <th scope="col" className="px-4 py-3.5 text-right">
              <span className="sr-only">Open full page</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {issues.map((issue) => {
            const isSelected = selectedIssueId === issue.id;
            return (
              <tr
                key={issue.id}
                data-selected={isSelected}
                onClick={() => onSelectIssue(issue.id)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#EFF6FF] shadow-[inset_4px_0_0_0_#1B365D]"
                    : "hover:bg-[#F8FAFC]"
                }`}
              >
                <td className="px-4 py-3.5 align-top">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="font-headline text-sm font-bold tabular-nums text-[#0F172A]">
                      {issue.urgencyScore} / 100
                    </span>
                    <PriorityBadge priority={issue.priority} />
                  </div>
                </td>

                <td className="max-w-xs px-4 py-3.5 align-top">
                  <Link
                    href={`/issues/${issue.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-[11px] font-bold text-[#0369A1] hover:underline"
                  >
                    #{issue.referenceCode}
                  </Link>
                  <button
                    type="button"
                    onClick={() => onSelectIssue(issue.id)}
                    aria-current={isSelected ? "true" : undefined}
                    aria-label={`Select issue ${issue.referenceCode}: ${issue.title}`}
                    className="mt-0.5 block text-left font-semibold text-[#0F172A] hover:text-[#0369A1]"
                  >
                    {issue.title}
                  </button>
                  <p className="mt-0.5 text-[11px] text-[#475569]">
                    {issue.location.address} • {issue.city}, {issue.state}
                  </p>
                </td>

                <td className="min-w-[10rem] px-4 py-3.5 align-top">
                  <span
                    title={issue.department}
                    className="inline-flex max-w-[13rem] items-start gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold leading-snug text-[#0F172A]"
                  >
                    <Building2
                      className="mt-px h-3.5 w-3.5 shrink-0 text-[#1B365D]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-words">
                      {issue.department}
                    </span>
                  </span>
                </td>

                <td className="px-4 py-3.5 align-top">
                  <StatusBadge status={issue.status} />
                </td>

                <td className="px-4 py-3.5 text-right align-top">
                  <div className="flex flex-col items-end gap-1.5">
                    {issue.status === "Pending Verification" && (
                      <Link
                        href={`/admin/review/${issue.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#5B21B6] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition-colors hover:bg-[#4C1D95]"
                      >
                        Review Completion
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">
                          {" "}
                          for issue {issue.referenceCode}
                        </span>
                      </Link>
                    )}
                    <Link
                      href={`/issues/${issue.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#0369A1] hover:bg-[#EFF6FF]"
                    >
                      View
                      <span aria-hidden="true">↗</span>
                      <span className="sr-only">
                        {" "}
                        full page for issue {issue.referenceCode}
                      </span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
          {issues.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-sm text-[#475569]"
              >
                No issues match your current queue filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
