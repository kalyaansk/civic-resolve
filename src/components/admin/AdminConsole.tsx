"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Flag,
  KeyRound,
  Lock,
  OctagonAlert,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ResolutionDrawer } from "@/components/admin/ResolutionDrawer";
import { useAuth } from "@/components/auth/AuthProvider";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badges";
import { formatIssuesAsCsv } from "@/lib/utils";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  MUNICIPAL_DEPARTMENTS,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  type MunicipalDepartment,
} from "@/types/issue";

interface AdminConsoleProps {
  initialIssues: Issue[];
  initialBanner?: {
    updated: string;
    decision?: "approved" | "rework";
  } | null;
}

export function AdminConsole({
  initialIssues,
  initialBanner = null,
}: AdminConsoleProps) {
  const { user, loading, demoEnabled, signInDemoAdmin, getAuthHeaders, openSignInDialog } =
    useAuth();
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    [...initialIssues].sort((a, b) => b.urgencyScore - a.urgencyScore)[0]?.id ??
      null,
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [decisionBanner, setDecisionBanner] = useState<{
    updated: string;
    decision?: "approved" | "rework";
  } | null>(initialBanner);

  const isAuthority = user?.role === "authority";

  const availableStates = useMemo(() => {
    return Array.from(new Set(issues.map((i) => i.state).filter(Boolean))).sort();
  }, [issues]);

  const availableCities = useMemo(() => {
    const scoped =
      stateFilter === "All"
        ? issues
        : issues.filter((i) => i.state === stateFilter);
    return Array.from(new Set(scoped.map((i) => i.city).filter(Boolean))).sort();
  }, [issues, stateFilter]);

  const regionQueue = useMemo(() => {
    return issues.filter((issue) => {
      if (stateFilter !== "All" && issue.state !== stateFilter) return false;
      if (cityFilter !== "All" && issue.city !== cityFilter) return false;
      return true;
    });
  }, [issues, stateFilter, cityFilter]);

  const metrics = useMemo(() => {
    const critical = regionQueue.filter(
      (i) => i.priority === "Critical" && i.status !== "Resolved",
    ).length;
    const reported = regionQueue.filter((i) => i.status === "Reported").length;
    const inProgress = regionQueue.filter((i) => i.status === "In Progress").length;
    const pendingVerification = regionQueue.filter(
      (i) => i.status === "Pending Verification",
    ).length;
    const resolved = regionQueue.filter((i) => i.status === "Resolved").length;
    return { critical, reported, inProgress, pendingVerification, resolved };
  }, [regionQueue]);

  const pendingIssuesSorted = useMemo(
    () =>
      [...issues]
        .filter((i) => i.status === "Pending Verification")
        .sort((a, b) => b.urgencyScore - a.urgencyScore),
    [issues],
  );

  const totalPendingApprovals = pendingIssuesSorted.length;
  const firstPendingIssue = pendingIssuesSorted[0] ?? null;

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...regionQueue]
      .filter((issue) => {
        if (departmentFilter !== "All" && issue.department !== departmentFilter)
          return false;
        if (statusFilter !== "All" && issue.status !== statusFilter)
          return false;
        if (priorityFilter !== "All" && issue.priority !== priorityFilter)
          return false;
        if (q) {
          const text = [
            issue.referenceCode,
            issue.title,
            issue.description,
            issue.location.address,
            issue.city,
            issue.state,
            issue.department,
          ]
            .join(" ")
            .toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [regionQueue, search, departmentFilter, statusFilter, priorityFilter]);

  // Falls back to the most urgent visible complaint when the selection is filtered out.
  const selectedIssue =
    filteredQueue.find((item) => item.id === selectedIssueId) ??
    filteredQueue[0] ??
    null;

  const patchIssue = useCallback(
    async (
      issueId: string,
      payload: {
        status?: IssueStatus;
        department?: MunicipalDepartment;
        priority?: IssuePriority;
        resolutionNote?: string;
        reviewDecision?: "approve" | "reject";
      },
    ) => {
      setSavingId(issueId);
      setErrorMessage(null);
      setFeedback(null);

      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/issues/${issueId}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });

        const data = (await res.json().catch(() => ({}))) as {
          issue?: Issue;
          error?: string;
        };

        if (!res.ok || !data.issue) {
          const msg = data.error || "Failed to update issue.";
          setErrorMessage(msg);
          throw new Error(msg);
        }

        const updatedIssue = data.issue;
        setIssues((prev) => {
          const next = prev.map((item) =>
            item.id === updatedIssue.id ? updatedIssue : item,
          );
          if (
            statusFilter === "Pending Verification" &&
            !next.some((item) => item.status === "Pending Verification")
          ) {
            setStatusFilter("All");
          }
          return next;
        });
        setFeedback(`Updated #${updatedIssue.referenceCode} successfully.`);
      } finally {
        setSavingId(null);
      }
    },
    [getAuthHeaders, statusFilter],
  );

  const handleExportCsv = () => {
    const csv = formatIssuesAsCsv(filteredQueue);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `civicresolve-authority-queue-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setFeedback(`Exported ${filteredQueue.length} queue records to CSV.`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-12">
        <p className="text-sm font-medium text-[#475569]">
          Verifying municipal authority session...
        </p>
      </div>
    );
  }

  // Tier 2 Citizen or Field Worker trying to access /admin -> strict 403 Restricted screen
  if (user && !isAuthority) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <section
          role="alert"
          className="rounded-2xl border border-[#FECACA] bg-white p-8 shadow-sm text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#991B1B]">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#991B1B]">
            HTTP 403 • Access Denied
          </p>
          <h1 className="mt-1 font-headline text-2xl font-bold text-[#0F172A]">
            403 Restricted — Municipal Authorities Only
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            You are currently signed in with a{" "}
            <strong>
              {user.role === "worker" ? "Field Worker" : "Citizen"}
            </strong>{" "}
            account ({user.displayName}). Municipal dispatch, status updates,
            completion approvals, and department reassignments are restricted to
            pre-authorized City Officials.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user.role === "worker" ? "/worker" : "/"}
              className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
            >
              {user.role === "worker"
                ? "Return to Field Tasks"
                : "Return to Explore Issues"}
            </Link>
            <Link
              href={user.role === "worker" ? "/" : "/my-issues"}
              className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              {user.role === "worker"
                ? "View Public Feed"
                : "View My Reported Issues"}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Unauthenticated Visitor -> Official Authority Sign-In gate
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B365D] text-white">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#0F172A]">
                Municipal Authority Authentication Required
              </h1>
              <p className="text-sm text-[#475569]">
                Official sign-in protects municipal dispatch queues and status
                updates.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#334155]">
            Sign in with a pre-authorized Municipal Authority account or launch
            the evaluator Demo Authority session to triage urgency-sorted queues,
            reassign departments, and publish resolution notes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {demoEnabled && (
              <button
                type="button"
                onClick={() => void signInDemoAdmin()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59]"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Evaluator / Demo Authority Access
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                openSignInDialog({
                  tab: "authority",
                  mode: "signin",
                  returnTo: "/admin",
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              Official Authority Sign-In
            </button>
          </div>
        </section>
      </div>
    );
  }

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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
      {/* Header row with Compact Top-Right Operational Stat Strip */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#99EFE5] bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0F766E]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Municipal Authority: {user.displayName}
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
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm shrink-0"
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
            onClick={handleExportCsv}
            aria-label="Export CSV"
            className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </button>
        </section>
      </div>

      {/* Post-Review Confirmation Banner (after redirect from /admin/review/[id]) */}
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
            onClick={() => setDecisionBanner(null)}
            aria-label="Dismiss notification"
            className="rounded-md p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      )}

      {/* Authority Pending Verification Notification Banner */}
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

      {/* Filter & Queue Controls (with Cascading State -> City) */}
      <section
        aria-label="Queue filters"
        className="mt-5 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-3"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <label htmlFor="admin-search" className="sr-only">
              Search issue ID, street, or description
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              aria-hidden="true"
            />
            <input
              id="admin-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issue ID, street, city, or description..."
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-2 pl-9 pr-3 text-xs text-[#0F172A] focus:bg-white"
            />
          </div>

          <span className="inline-flex shrink-0 self-start items-center gap-1.5 rounded-full border border-[#99EFE5] bg-[#F0FDFA] px-3 py-1.5 text-[11px] font-semibold text-[#0F766E] lg:self-auto">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Sorted: Urgency Score High → Low
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="admin-state-filter" className="sr-only">
              Filter by State
            </label>
            <select
              id="admin-state-filter"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCityFilter("All");
              }}
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]"
            >
              <option value="All">State: All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-city-filter" className="sr-only">
              Filter by City
            </label>
            <select
              id="admin-city-filter"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]"
            >
              <option value="All">City: All Cities</option>
              {availableCities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-dept-filter" className="sr-only">
              Filter by Department
            </label>
            <select
              id="admin-dept-filter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]"
            >
              <option value="All">Department: All</option>
              {MUNICIPAL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-status-filter" className="sr-only">
              Filter by Status
            </label>
            <select
              id="admin-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]"
            >
              <option value="All">Status: All</option>
              {ISSUE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === "Pending Verification"
                    ? `Status: Pending Verification (${metrics.pendingVerification})`
                    : `Status: ${st}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-priority-filter" className="sr-only">
              Filter by Priority
            </label>
            <select
              id="admin-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]"
            >
              <option value="All">Priority: All</option>
              {ISSUE_PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  Priority: {pr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div aria-live="polite" className="mt-3 min-h-5">
        {feedback && (
          <p className="text-xs font-semibold text-[#0F766E]">{feedback}</p>
        )}
        {errorMessage && (
          <p role="alert" className="text-xs font-semibold text-[#991B1B]">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Main Split: Urgency-Sorted Table + Operations Inspector */}
      <div className="mt-3 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className={selectedIssue ? "min-w-0 lg:col-span-8" : "lg:col-span-12"}>
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
                {filteredQueue.map((issue) => {
                  const isSelected = selectedIssue?.id === issue.id;
                  return (
                    <tr
                      key={issue.id}
                      data-selected={isSelected}
                      onClick={() => setSelectedIssueId(issue.id)}
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
                          onClick={() => setSelectedIssueId(issue.id)}
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
                              <ArrowRight
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
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
                {filteredQueue.length === 0 && (
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
        </div>

        {selectedIssue && (
          <div className="min-w-0 lg:sticky lg:top-24 lg:col-span-4">
            <ResolutionDrawer
              key={selectedIssue.id}
              issue={selectedIssue}
              saving={savingId === selectedIssue.id}
              onSave={patchIssue}
            />
          </div>
        )}
      </div>
    </div>
  );
}
