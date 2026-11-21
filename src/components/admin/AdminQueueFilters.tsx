"use client";

import { Search, Sparkles } from "lucide-react";
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  MUNICIPAL_DEPARTMENTS,
} from "@/types/issue";

const SELECT_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A]";

interface AdminQueueFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  stateFilter: string;
  availableStates: string[];
  onStateChange: (value: string) => void;
  cityFilter: string;
  availableCities: string[];
  onCityChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  statusFilter: string;
  pendingCount: number;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
}

export function AdminQueueFilters({
  search,
  onSearchChange,
  stateFilter,
  availableStates,
  onStateChange,
  cityFilter,
  availableCities,
  onCityChange,
  departmentFilter,
  onDepartmentChange,
  statusFilter,
  pendingCount,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
}: AdminQueueFiltersProps) {
  return (
    <section
      aria-label="Queue filters"
      className="mt-5 space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-[200px] flex-1">
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
            onChange={(e) => onSearchChange(e.target.value)}
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
          <label htmlFor="admin-city-filter" className="sr-only">
            Filter by City
          </label>
          <select
            id="admin-city-filter"
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
          <label htmlFor="admin-dept-filter" className="sr-only">
            Filter by Department
          </label>
          <select
            id="admin-dept-filter"
            value={departmentFilter}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className={SELECT_CLASS}
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
            onChange={(e) => onStatusChange(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="All">Status: All</option>
            {ISSUE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === "Pending Verification"
                  ? `Status: Pending Verification (${pendingCount})`
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
      </div>
    </section>
  );
}
