"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Columns2,
  Download,
  Flag,
  LayoutList,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { IssueCard } from "@/components/dashboard/IssueCard";
import { CivicMap } from "@/components/maps/CivicMap";
import { RadioPills, type RadioPillOption } from "@/components/ui/RadioPills";
import {
  computeDashboardStats,
  formatIssuesAsCsv,
  formatIssuesAsJson,
} from "@/lib/utils";
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  type DashboardStats,
  type Issue,
} from "@/types/issue";

type ViewMode = "split" | "list" | "map";

const VIEW_OPTIONS: readonly RadioPillOption<ViewMode>[] = [
  {
    value: "split",
    label: "Map + List",
    icon: <Columns2 className="h-4 w-4" aria-hidden="true" />,
  },
  {
    value: "list",
    label: "List Only",
    icon: <LayoutList className="h-4 w-4" aria-hidden="true" />,
  },
  {
    value: "map",
    label: "Map Only",
    icon: <MapIcon className="h-4 w-4" aria-hidden="true" />,
  },
];

interface PublicDashboardProps {
  initialIssues: Issue[];
  initialStats: DashboardStats;
}

function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function PublicDashboard({
  initialIssues,
  initialStats,
}: PublicDashboardProps) {
  const { user, getAuthHeaders, openSignInDialog } = useAuth();
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recent" | "urgency" | "upvotes">(
    "recent",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const scrollToFocusedRef = useRef(false);
  const [upvotingIds, setUpvotingIds] = useState<Record<string, boolean>>({});
  const [exportStatus, setExportStatus] = useState<string>("");

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

  const regionIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (stateFilter !== "All" && issue.state !== stateFilter) return false;
      if (cityFilter !== "All" && issue.city !== cityFilter) return false;
      return true;
    });
  }, [issues, stateFilter, cityFilter]);

  const dynamicStats = useMemo(() => {
    if (
      stateFilter === "All" &&
      cityFilter === "All" &&
      issues === initialIssues
    ) {
      return initialStats;
    }
    return computeDashboardStats(regionIssues);
  }, [stateFilter, cityFilter, issues, initialIssues, initialStats, regionIssues]);

  const filteredIssues = useMemo(() => {
    const q = search.trim().toLowerCase();
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
      if (sortBy === "urgency") {
        if (b.urgencyScore !== a.urgencyScore) {
          return b.urgencyScore - a.urgencyScore;
        }
      } else if (sortBy === "upvotes") {
        if (b.upvotes !== a.upvotes) {
          return b.upvotes - a.upvotes;
        }
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    regionIssues,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
    sortBy,
  ]);

  const handleStateChange = (nextState: string) => {
    setStateFilter(nextState);
    setCityFilter("All");
  };

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

  const handleExportCsv = () => {
    const csv = formatIssuesAsCsv(filteredIssues);
    triggerFileDownload(
      csv,
      `civicresolve-issues-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
    );
    setExportStatus(`Exported ${filteredIssues.length} issues to CSV.`);
  };

  const handleExportJson = () => {
    const json = formatIssuesAsJson(filteredIssues);
    triggerFileDownload(
      json,
      `civicresolve-issues-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json;charset=utf-8;",
    );
    setExportStatus(`Exported ${filteredIssues.length} issues to JSON.`);
  };

  const resetAllFilters = () => {
    setSearch("");
    setStateFilter("All");
    setCityFilter("All");
    setStatusFilter("All");
    setPriorityFilter("All");
    setCategoryFilter("All");
  };

  const activeIssueId = filteredIssues.some((item) => item.id === focusedIssueId)
    ? focusedIssueId
    : (filteredIssues[0]?.id ?? null);

  const handleFocusIssue = useCallback((issueId: string) => {
    setFocusedIssueId(issueId);
  }, []);

  /** Map pin clicks also scroll the matching card into view inside the list. */
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
    filteredIssues.map((issue) => {
      const isUpvotedByMe = Boolean(
        user?.uid && issue.upvotedBy.includes(user.uid),
      );
      return (
        <IssueCard
          key={issue.id}
          issue={issue}
          variant={variant}
          selected={viewMode !== "list" && activeIssueId === issue.id}
          upvoted={isUpvotedByMe}
          upvoting={Boolean(upvotingIds[issue.id])}
          onUpvote={handleUpvote}
          onFocusIssue={viewMode === "list" ? undefined : handleFocusIssue}
        />
      );
    });

  const emptyState = (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
      <p className="font-headline text-base font-bold text-[#0F172A]">
        No civic issues match your current filters
      </p>
      <p className="mt-1 text-sm text-[#475569]">
        Try clearing your search terms or selecting &ldquo;All&rdquo; in the
        State, City, Status, and Priority dropdowns.
      </p>
      <button
        type="button"
        onClick={resetAllFilters}
        className="mt-4 inline-flex items-center rounded-lg bg-[#1B365D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002046]"
      >
        Reset Filters
      </button>
    </div>
  );

  const selectClass =
    "w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]";

  const compactStats = [
    {
      label: "Total",
      value: dynamicStats.total,
      Icon: ClipboardList,
      badgeClass: "bg-[#EFF6FF] text-[#1B365D] border-[#BFDBFE]",
    },
    {
      label: "Reported",
      value: dynamicStats.reported,
      Icon: Flag,
      badgeClass: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
    },
    {
      label: "In Progress",
      value: dynamicStats.inProgress,
      Icon: Clock,
      badgeClass: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]",
    },
    {
      label: "Resolved",
      value: dynamicStats.resolved,
      Icon: CheckCircle2,
      badgeClass: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
      {/* Header row with Top-Right Compact Civic Overview Strip */}
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

        {/* Sleek Top-Right Compact Overview Strip + Small CSV/JSON Exports */}
        <section
          aria-label="Civic overview summary and exports"
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm shrink-0"
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
              onClick={handleExportCsv}
              aria-label="Export CSV"
              className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              aria-label="Export JSON"
              className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              JSON
            </button>
          </div>
        </section>
      </div>

      {/* Full-Width Tracking Workspace */}
      <div className="mt-5 space-y-4">
        <section
          aria-label="Filter and view controls"
          className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[220px] flex-1">
              <label htmlFor="dashboard-search" className="sr-only">
                Search issues by title, street, or ID
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
                aria-hidden="true"
              />
              <input
                id="dashboard-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues by title, street, city, or ID..."
                className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-2 pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
              />
            </div>

            <RadioPills
              label="Issue display mode"
              options={VIEW_OPTIONS}
              value={viewMode}
              onChange={setViewMode}
              variant="segmented"
              className="inline-flex shrink-0 self-start rounded-xl border-2 border-[#1B365D]/25 bg-[#F1F5F9] p-1 lg:self-auto"
              optionClassName="rounded-lg px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label htmlFor="filter-state" className="sr-only">
                Filter by State
              </label>
              <select
                id="filter-state"
                value={stateFilter}
                onChange={(e) => handleStateChange(e.target.value)}
                className={selectClass}
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
              <label htmlFor="filter-city" className="sr-only">
                Filter by City
              </label>
              <select
                id="filter-city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className={selectClass}
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
              <label htmlFor="filter-status" className="sr-only">
                Filter by Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass}
              >
                <option value="All">Status: All</option>
                {ISSUE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    Status: {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-priority" className="sr-only">
                Filter by Priority
              </label>
              <select
                id="filter-priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={selectClass}
              >
                <option value="All">Priority: All</option>
                {ISSUE_PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    Priority: {pr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-category" className="sr-only">
                Filter by Category
              </label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectClass}
              >
                <option value="All">Category: All</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-sort" className="sr-only">
                Sort issues
              </label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "recent" | "urgency" | "upvotes")
                }
                className={selectClass}
              >
                <option value="recent">Sort: Most Recent</option>
                <option value="urgency">Sort: AI Urgency</option>
                <option value="upvotes">Sort: Most Upvoted</option>
              </select>
            </div>
          </div>
        </section>

        {/* Live status region for screen readers */}
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
            <span className="font-semibold text-[#0F766E]">
              {exportStatus}
            </span>
          )}
        </div>

        {filteredIssues.length === 0 ? (
          emptyState
        ) : viewMode === "list" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {renderCards("full")}
          </div>
        ) : viewMode === "map" ? (
          <CivicMap
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
              <CivicMap
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
