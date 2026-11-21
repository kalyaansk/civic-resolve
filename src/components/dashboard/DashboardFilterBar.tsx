"use client";

import { Columns2, LayoutList, Map as MapIcon, Search } from "lucide-react";
import { RadioPills, type RadioPillOption } from "@/components/ui/RadioPills";
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
} from "@/types/issue";

export type DashboardViewMode = "split" | "list" | "map";
export type DashboardSortOption = "recent" | "urgency" | "upvotes";

const VIEW_OPTIONS: readonly RadioPillOption<DashboardViewMode>[] = [
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

const SELECT_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]";

interface DashboardFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: DashboardViewMode;
  onViewModeChange: (mode: DashboardViewMode) => void;
  stateFilter: string;
  availableStates: string[];
  onStateChange: (value: string) => void;
  cityFilter: string;
  availableCities: string[];
  onCityChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  sortBy: DashboardSortOption;
  onSortChange: (value: DashboardSortOption) => void;
}

export function DashboardFilterBar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  stateFilter,
  availableStates,
  onStateChange,
  cityFilter,
  availableCities,
  onCityChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
}: DashboardFilterBarProps) {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search issues by title, street, city, or ID..."
            className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-2 pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
          />
        </div>

        <RadioPills
          label="Issue display mode"
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
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
            onChange={(e) => onStateChange(e.target.value)}
            className={SELECT_CLASS}
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
            onChange={(e) => onCityChange(e.target.value)}
            className={SELECT_CLASS}
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
            onChange={(e) => onStatusChange(e.target.value)}
            className={SELECT_CLASS}
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
            onChange={(e) => onPriorityChange(e.target.value)}
            className={SELECT_CLASS}
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
            onChange={(e) => onCategoryChange(e.target.value)}
            className={SELECT_CLASS}
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
              onSortChange(e.target.value as DashboardSortOption)
            }
            className={SELECT_CLASS}
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="urgency">Sort: AI Urgency</option>
            <option value="upvotes">Sort: Most Upvoted</option>
          </select>
        </div>
      </div>
    </section>
  );
}
