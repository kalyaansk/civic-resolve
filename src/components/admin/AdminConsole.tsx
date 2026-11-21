"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminHeaderStrip,
  type AdminDecisionBanner,
} from "@/components/admin/AdminHeaderStrip";
import { AdminQueueFilters } from "@/components/admin/AdminQueueFilters";
import { AdminQueueTable } from "@/components/admin/AdminQueueTable";
import { ResolutionDrawer } from "@/components/admin/ResolutionDrawer";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleAccessGate } from "@/components/auth/RoleAccessGate";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { computeDashboardStats } from "@/lib/utils";
import {
  formatIssuesAsCsv,
  triggerFileDownload,
} from "@/lib/utils/formatters";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
  MunicipalDepartment,
} from "@/types/issue";

interface AdminConsoleProps {
  initialIssues: Issue[];
  initialBanner?: AdminDecisionBanner | null;
}

export function AdminConsole({
  initialIssues,
  initialBanner = null,
}: AdminConsoleProps) {
  const { user, loading, getAuthHeaders } = useAuth();
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
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
  const [decisionBanner, setDecisionBanner] =
    useState<AdminDecisionBanner | null>(initialBanner);

  const availableStates = useMemo(
    () =>
      Array.from(new Set(issues.map((i) => i.state).filter(Boolean))).sort(),
    [issues],
  );

  const availableCities = useMemo(() => {
    const scoped =
      stateFilter === "All"
        ? issues
        : issues.filter((i) => i.state === stateFilter);
    return Array.from(
      new Set(scoped.map((i) => i.city).filter(Boolean)),
    ).sort();
  }, [issues, stateFilter]);

  const regionQueue = useMemo(
    () =>
      issues.filter((issue) => {
        if (stateFilter !== "All" && issue.state !== stateFilter) return false;
        if (cityFilter !== "All" && issue.city !== cityFilter) return false;
        return true;
      }),
    [issues, stateFilter, cityFilter],
  );

  const metrics = useMemo(
    () => computeDashboardStats(regionQueue),
    [regionQueue],
  );

  const pendingIssuesSorted = useMemo(
    () =>
      [...issues]
        .filter((i) => i.status === "Pending Verification")
        .sort((a, b) => b.urgencyScore - a.urgencyScore),
    [issues],
  );

  const filteredQueue = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
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
  }, [
    regionQueue,
    debouncedSearch,
    departmentFilter,
    statusFilter,
    priorityFilter,
  ]);

  const selectedIssue = useMemo(
    () =>
      filteredQueue.find((item) => item.id === selectedIssueId) ??
      filteredQueue[0] ??
      null,
    [filteredQueue, selectedIssueId],
  );

  const handleStateChange = useCallback((value: string) => {
    setStateFilter(value);
    setCityFilter("All");
  }, []);

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

  const handleExportCsv = useCallback(() => {
    const csv = formatIssuesAsCsv(filteredQueue);
    triggerFileDownload(
      csv,
      `civicresolve-authority-queue-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
    );
    setFeedback(`Exported ${filteredQueue.length} queue records to CSV.`);
  }, [filteredQueue]);

  const handleDismissBanner = useCallback(() => setDecisionBanner(null), []);

  if (loading || !user || user.role !== "authority") {
    return (
      <RoleAccessGate
        requiredRole="authority"
        returnTo="/admin"
        authDescription="Sign in with a pre-authorized Municipal Authority account or launch the evaluator Demo Authority session to triage urgency-sorted queues, reassign departments, and publish resolution notes."
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
      <AdminHeaderStrip
        displayName={user.displayName}
        metrics={metrics}
        totalPendingApprovals={pendingIssuesSorted.length}
        firstPendingIssue={pendingIssuesSorted[0] ?? null}
        decisionBanner={decisionBanner}
        onDismissBanner={handleDismissBanner}
        onExportCsv={handleExportCsv}
      />

      <AdminQueueFilters
        search={search}
        onSearchChange={setSearch}
        stateFilter={stateFilter}
        availableStates={availableStates}
        onStateChange={handleStateChange}
        cityFilter={cityFilter}
        availableCities={availableCities}
        onCityChange={setCityFilter}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        statusFilter={statusFilter}
        pendingCount={metrics.pendingVerification}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

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

      <div className="mt-3 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div
          className={selectedIssue ? "min-w-0 lg:col-span-8" : "lg:col-span-12"}
        >
          <AdminQueueTable
            issues={filteredQueue}
            selectedIssueId={selectedIssue?.id ?? null}
            onSelectIssue={setSelectedIssueId}
          />
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
