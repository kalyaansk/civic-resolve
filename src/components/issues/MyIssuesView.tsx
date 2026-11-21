"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  Flag,
  MapPin,
  Plus,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AIDepartmentBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/IssueBadges";
import { formatDateTime } from "@/lib/utils/formatters";
import { ISSUE_STATUSES, type Issue } from "@/types/issue";

function getStageIndex(status: Issue["status"]): number {
  return ISSUE_STATUSES.indexOf(status);
}

export function MyIssuesView() {
  const { user, loading, getAuthHeaders, openSignInDialog } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    const loadMine = async () => {
      setFetching(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/issues?mine=true&limit=50", {
          method: "GET",
          credentials: "same-origin",
          headers,
        });
        if (!res.ok) {
          throw new Error("Unable to load your reported issues.");
        }
        const data = (await res.json()) as { issues: Issue[] };
        if (!cancelled) {
          setIssues(data.issues ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load reported issues.",
          );
        }
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    };

    void loadMine();
    return () => {
      cancelled = true;
    };
  }, [user, getAuthHeaders]);

  const displayedIssues = user ? issues : [];

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-12">
        <p className="text-sm font-medium text-[#475569]">
          Loading your CivicResolve account...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1B365D]">
            <UserCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-headline text-2xl font-bold text-[#0F172A]">
            My Reported Issues
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Sign in to your Citizen Portal account to track real-time municipal
            status updates, AI urgency scores, and official resolution notes for
            the issues you submitted.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                openSignInDialog({
                  tab: "citizen",
                  mode: "signin",
                  returnTo: "/my-issues",
                })
              }
              className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
            >
              Sign In to View My Issues
            </button>
            <button
              type="button"
              onClick={() =>
                openSignInDialog({
                  tab: "citizen",
                  mode: "register",
                  returnTo: "/my-issues",
                })
              }
              className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              Register Citizen Account
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Citizen Portal • {user.displayName}
          </span>
          <h1 className="mt-3 font-headline text-3xl font-bold tracking-tight text-[#0F172A]">
            My Reported Issues
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            Track dispatch progress, Gemini AI triage scores, and official
            municipal resolution updates for your submissions.
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#1B365D] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#002046]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Report an Issue
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]"
        >
          {error}
        </div>
      )}

      {fetching ? (
        <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center text-sm text-[#475569]">
          Loading your submitted reports...
        </div>
      ) : displayedIssues.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
          <ClipboardList
            className="mx-auto h-10 w-10 text-[#64748B]"
            aria-hidden="true"
          />
          <h2 className="mt-3 font-headline text-lg font-bold text-[#0F172A]">
            You haven&apos;t submitted any civic issues yet
          </h2>
          <p className="mt-1 text-sm text-[#475569]">
            Spot a pothole, broken streetlight, water leak, or sanitation hazard?
            Report it in under a minute with Gemini AI triage.
          </p>
          <Link
            href="/report"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Submit Your First Report
          </Link>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {displayedIssues.map((issue) => {
            const currentStage = getStageIndex(issue.status);
            return (
              <article
                key={issue.id}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-0.5 font-mono text-xs font-bold text-[#1B365D]">
                        #{issue.referenceCode}
                      </span>
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      <span className="rounded-full border border-[#99EFE5] bg-[#F0FDFA] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#0F766E]">
                        Urgency {issue.urgencyScore} / 100
                      </span>
                      <AIDepartmentBadge department={issue.department} />
                    </div>
                    <h2 className="font-headline text-lg font-bold text-[#0F172A]">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="hover:text-[#0369A1] hover:underline"
                      >
                        {issue.title}
                      </Link>
                    </h2>
                    <p className="flex items-center gap-1.5 text-xs text-[#475569]">
                      <MapPin
                        className="h-3.5 w-3.5 text-[#0369A1]"
                        aria-hidden="true"
                      />
                      <span>
                        {issue.location.address} • {issue.city}, {issue.state}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>Reported {formatDateTime(issue.createdAt)}</span>
                    </p>
                  </div>

                  <Link
                    href={`/issues/${issue.id}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#1B365D] hover:bg-[#EFF6FF]"
                  >
                    View Full Timeline
                  </Link>
                </div>

                {/* 4-Stage Progress Stepper */}
                <div className="mt-5">
                  <ol
                    aria-label={`Progress for ${issue.referenceCode}`}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    {ISSUE_STATUSES.map((stage, idx) => {
                      const completed = idx <= currentStage;
                      const isCurrent = idx === currentStage;
                      const Icon =
                        stage === "Reported"
                          ? Flag
                          : stage === "In Progress"
                            ? Clock
                            : stage === "Pending Verification"
                              ? FileCheck2
                              : CheckCircle2;
                      return (
                        <li
                          key={stage}
                          className={`flex items-center gap-3 rounded-xl border p-3 ${
                            isCurrent
                              ? "border-[#1B365D] bg-[#EFF6FF]"
                              : completed
                                ? "border-[#A7F3D0] bg-[#ECFDF5]"
                                : "border-[#E2E8F0] bg-[#F8FAFC] opacity-70"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                              isCurrent
                                ? "bg-[#1B365D] text-white"
                                : completed
                                  ? "bg-[#065F46] text-white"
                                  : "bg-[#E2E8F0] text-[#64748B]"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A]">
                              {stage}
                            </p>
                            <p className="text-[11px] text-[#475569]">
                              {isCurrent
                                ? "Current Stage"
                                : completed
                                  ? "Completed"
                                  : "Upcoming"}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {issue.resolutionNote && (
                  <div className="mt-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5 text-xs text-[#065F46]">
                    <span className="font-bold uppercase tracking-wider">
                      Latest Municipal Note:{" "}
                    </span>
                    <span>{issue.resolutionNote}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
