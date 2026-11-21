"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  DashboardFilterBar,
  type DashboardSortOption,
  type DashboardViewMode,
} from "@/components/dashboard/DashboardFilterBar";
import { DashboardHeaderStrip } from "@/components/dashboard/DashboardHeaderStrip";
import { IssueCard } from "@/components/dashboard/IssueCard";
import { DynamicCivicMap } from "@/components/maps/DynamicCivicMap";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { computeDashboardStats } from "@/lib/utils";
import {
  formatIssuesAsCsv,
  formatIssuesAsJson,
  triggerFileDownload,
} from "@/lib/utils/formatters";
import type { DashboardStats, Issue } from "@/types/issue";

interface PublicDashboardProps {
  initialIssues: Issue[];
  initialStats: DashboardStats;
}

export function PublicDashboard({
  initialIssues,
  initialStats,
}: PublicDashboardProps) {
  const { user, getAuthHeaders, openSignInDialog } = useAuth();
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<DashboardSortOption>("recent");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("split");
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const scrollToFocusedRef = useRef(false);
  const [upvotingIds, setUpvotingIds] = useState<Record<string, boolean>>({});
  const [exportStatus, setExportStatus] = useState<string>("");

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

  const regionIssues = useMemo(
    () =>
      issues.filter((issue) => {
        if (stateFilter !== "All" && issue.state !== stateFilter) return false;
        if (cityFilter !== "All" && issue.city !== cityFilter) return false;
        return true;
      }),
    [issues, stateFilter, cityFilter],
  );

  const dynamicStats = useMemo(() => {
    if (
      stateFilter === "All" &&
      cityFilter === "All" &&
      issues === initialIssues
    ) {
      return initialStats;
    }
    return computeDashboardStats(regionIssues);
  }, [
    stateFilter,
    cityFilter,
    issues,
    initialIssues,
    initialStats,
    regionIssues,
  ]);

  const filteredIssues = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = regionIssues.filter((issue) => {
      if (statusFilter !== "All" && issue.status !== statusFilter) return false;
      if (priorityFilter !== "All" && issue.priority !== priorityFilter)
        return false;
      if (categoryFilter !== "All" && issue.category !== categoryFilter)
        return false;

      if (q) {
        const text = [
          issue.referenceCode,
          issue.title,
          issue.description,
          issue.location.address,
          issue.location.district,
          issue.city,
          issue.state,
          issue.department,
          issue.category,
        ]
          .join(" ")
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "urgency" && b.urgencyScore !== a.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      if (sortBy === "upvotes" && b.upvotes !== a.upvotes) {
        return b.upvotes - a.upvotes;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    regionIssues,
    debouncedSearch,
    statusFilter,
    priorityFilter,
    categoryFilter,
    sortBy,
  ]);

  const handleStateChange = useCallback((nextState: string) => {
    setStateFilter(nextState);
    setCityFilter("All");
  }, []);

  const handleUpvote = useCallback(
    async (issueId: string) => {
      if (!user) {
        openSignInDialog({
          tab: "citizen",
          mode: "signin",
          message: "Please sign in as a Citizen to upvote civic issues.",
        });
        return;
      }

      setUpvotingIds((prev) => ({ ...prev, [issueId]: true }));
      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/issues/${issueId}/upvote`, {
          method: "POST",
          credentials: "same-origin",
          headers: authHeaders,
        });
        if (res.status === 401) {
          openSignInDialog({
            tab: "citizen",
            mode: "signin",
            message: "Please sign in as a Citizen to upvote civic issues.",
          });
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as {
          id: string;
          upvotes: number;
          upvotedBy: string[];
        };
        setIssues((prev) =>
          prev.map((item) =>
            item.id === data.id
              ? {
                  ...item,
                  upvotes: data.upvotes,
                  upvotedBy: data.upvotedBy ?? item.upvotedBy,
                }
              : item,
          ),
        );
      } finally {
        setUpvotingIds((prev) => ({ ...prev, [issueId]: false }));
      }
    },
    [user, getAuthHeaders, openSignInDialog],
  );

  const handleExportCsv = useCallback(() => {
    const csv = formatIssuesAsCsv(filteredIssues);
    triggerFileDownload(
      csv,
      `civicresolve-issues-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
    );
    setExportStatus(`Exported ${filteredIssues.length} issues to CSV.`);
  }, [filteredIssues]);

  const handleExportJson = useCallback(() => {
    const json = formatIssuesAsJson(filteredIssues);
    triggerFileDownload(
      json,
      `civicresolve-issues-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json;charset=utf-8;",
    );
    setExportStatus(`Exported ${filteredIssues.length} issues to JSON.`);
  }, [filteredIssues]);

  const resetAllFilters = useCallback(() => {
    setSearch("");
    setStateFilter("All");
    setCityFilter("All");
    setStatusFilter("All");
    setPriorityFilter("All");
    setCategoryFilter("All");
  }, []);

  const activeIssueId = useMemo(
    () =>
      filteredIssues.some((item) => item.id === focusedIssueId)
        ? focusedIssueId
        : (filteredIssues[0]?.id ?? null),
    [filteredIssues, focusedIssueId],
  );

  const handleFocusIssue = useCallback((issueId: string) => {
    setFocusedIssueId(issueId);
  }, []);

  const handleMapSelect = useCallback((issueId: string) => {
    scrollToFocusedRef.current = true;
    setFocusedIssueId(issueId);
  }, []);

  useEffect(() => {
    if (!scrollToFocusedRef.current || !focusedIssueId) return;
    scrollToFocusedRef.current = false;
    document
      .getElementById(`issue-card-${focusedIssueId}`)
      ?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [focusedIssueId]);

  const renderCards = (variant: "full" | "compact") =>
    filteredIssues.map((issue) => (
      <IssueCard
        key={issue.id}
        issue={issue}
        variant={variant}
        selected={viewMode !== "list" && activeIssueId === issue.id}
        upvoted={Boolean(user?.uid && issue.upvotedBy.includes(user.uid))}
        upvoting={Boolean(upvotingIds[issue.id])}
        onUpvote={handleUpvote}
        onFocusIssue={viewMode === "list" ? undefined : handleFocusIssue}
      />
    ));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
      <DashboardHeaderStrip
        stats={dynamicStats}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
      />

      <div className="mt-5 space-y-4">
        <DashboardFilterBar
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          stateFilter={stateFilter}
          availableStates={availableStates}
          onStateChange={handleStateChange}
          cityFilter={cityFilter}
          availableCities={availableCities}
          onCityChange={setCityFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#475569]"
        >
          <span>
            Showing{" "}
            <strong className="font-semibold text-[#0F172A]">
              {filteredIssues.length}
            </strong>{" "}
            of {regionIssues.length} regional civic issues
          </span>
          {exportStatus && (
            <span className="font-semibold text-[#0F766E]">{exportStatus}</span>
          )}
        </div>

        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
            <h2 className="font-headline text-lg font-bold text-[#0F172A]">
              No civic issues match your filters
            </h2>
            <p className="mt-1 text-sm text-[#475569]">
              Try resetting your State, City, or search criteria to explore
              active reports.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002046]"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {renderCards("full")}
          </div>
        ) : viewMode === "map" ? (
          <DynamicCivicMap
            mode="dashboard"
            issues={filteredIssues}
            selectedIssueId={activeIssueId}
            onSelectIssue={handleMapSelect}
            heightClassName="h-[420px] lg:h-[620px]"
            centerLat={filteredIssues[0]?.location.lat ?? 11.0168}
            centerLng={filteredIssues[0]?.location.lng ?? 76.9558}
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <div className="lg:sticky lg:top-24 lg:col-span-5">
              <DynamicCivicMap
                mode="dashboard"
                issues={filteredIssues}
                selectedIssueId={activeIssueId}
                onSelectIssue={handleMapSelect}
                heightClassName="h-[360px] lg:h-[580px]"
                centerLat={filteredIssues[0]?.location.lat ?? 11.0168}
                centerLng={filteredIssues[0]?.location.lng ?? 76.9558}
              />
            </div>
            <div
              role="region"
              aria-label="Issue list"
              tabIndex={0}
              className="flex flex-col gap-3.5 lg:col-span-7"
            >
              {renderCards("compact")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
