"use client";

import { ClipboardCheck, FileCheck2, Search, Wrench } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleAccessGate } from "@/components/auth/RoleAccessGate";
import { RadioPills, type RadioPillOption } from "@/components/ui/RadioPills";
import { WorkerTaskCard } from "@/components/worker/WorkerTaskCard";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { MUNICIPAL_DEPARTMENTS, type Issue } from "@/types/issue";

interface WorkerDashboardProps {
  initialIssues: Issue[];
}

type WorkerQueueTab = "ongoing" | "pending";

export function WorkerDashboard({ initialIssues }: WorkerDashboardProps) {
  const { user, loading } = useAuth();

  const [queueTab, setQueueTab] = useState<WorkerQueueTab>("ongoing");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const { ongoingCount, pendingCount } = useMemo(() => {
    let ongoing = 0;
    let pending = 0;
    for (const issue of initialIssues) {
      if (issue.status === "Reported" || issue.status === "In Progress") {
        ongoing += 1;
      } else if (issue.status === "Pending Verification") {
        pending += 1;
      }
    }
    return { ongoingCount: ongoing, pendingCount: pending };
  }, [initialIssues]);

  const availableStates = useMemo(
    () =>
      Array.from(
        new Set(initialIssues.map((i) => i.state).filter(Boolean)),
      ).sort(),
    [initialIssues],
  );

  const availableCities = useMemo(() => {
    const scoped =
      stateFilter === "All"
        ? initialIssues
        : initialIssues.filter((i) => i.state === stateFilter);
    return Array.from(
      new Set(scoped.map((i) => i.city).filter(Boolean)),
    ).sort();
  }, [initialIssues, stateFilter]);

  const visibleTasks = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return [...initialIssues]
      .filter((issue) => {
        if (queueTab === "ongoing") {
          if (issue.status !== "Reported" && issue.status !== "In Progress") {
            return false;
          }
        } else if (issue.status !== "Pending Verification") {
          return false;
        }
        if (stateFilter !== "All" && issue.state !== stateFilter) return false;
        if (cityFilter !== "All" && issue.city !== cityFilter) return false;
        if (departmentFilter !== "All" && issue.department !== departmentFilter)
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
    initialIssues,
    queueTab,
    stateFilter,
    cityFilter,
    departmentFilter,
    debouncedSearch,
  ]);

  const handleStateChange = useCallback((value: string) => {
    setStateFilter(value);
    setCityFilter("All");
  }, []);

  const queueTabOptions: readonly RadioPillOption<WorkerQueueTab>[] = useMemo(
    () => [
      {
        value: "ongoing",
        label: `Ongoing Tasks (${ongoingCount})`,
        icon: <Wrench className="h-3.5 w-3.5" aria-hidden="true" />,
      },
      {
        value: "pending",
        label: `Submitted for Approval (${pendingCount})`,
        icon: <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />,
      },
    ],
    [ongoingCount, pendingCount],
  );

  if (loading || !user || user.role !== "worker") {
    return (
      <RoleAccessGate
        requiredRole="worker"
        returnTo="/worker"
        authDescription="Authenticated Field Workers see assigned ongoing municipal defects, open dedicated task execution screens, and upload after-repair proof for instant Gemini AI before-vs-after verification prior to Authority approval."
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-xs font-semibold text-[#92400E]">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            Field Crew Execution: {user.displayName}
          </div>
          <h1 className="mt-2 font-headline text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            Field Worker Task Portal
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            Select any task below to open its full-screen execution workspace,
            upload After-Repair proof, and generate a Gemini AI Verification
            Report.
          </p>
        </div>

        <RadioPills
          label="Field work queue view"
          options={queueTabOptions}
          value={queueTab}
          onChange={setQueueTab}
          variant="segmented"
          className="inline-flex shrink-0 self-start rounded-xl border-2 border-[#1B365D]/20 bg-[#F1F5F9] p-1 md:self-auto"
          optionClassName="rounded-lg px-3.5 py-2 text-xs sm:text-sm"
        />
      </div>

      <section
        aria-label="Field task filters"
        className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="relative">
          <label htmlFor="worker-search" className="sr-only">
            Search field tasks
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            aria-hidden="true"
          />
          <input
            id="worker-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, street, city, or issue..."
            className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-2 pl-9 pr-3 text-xs text-[#0F172A] focus:bg-white"
          />
        </div>

        <div>
          <label htmlFor="worker-state-filter" className="sr-only">
            Filter by State
          </label>
          <select
            id="worker-state-filter"
            value={stateFilter}
            onChange={(e) => handleStateChange(e.target.value)}
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
          <label htmlFor="worker-city-filter" className="sr-only">
            Filter by City
          </label>
          <select
            id="worker-city-filter"
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
          <label htmlFor="worker-dept-filter" className="sr-only">
            Filter by Department
          </label>
          <select
            id="worker-dept-filter"
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
      </section>

      <section aria-label="Field work task list" className="mt-5">
        {visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
            <ClipboardCheck
              className="mx-auto h-9 w-9 text-[#64748B]"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-headline text-base font-bold text-[#0F172A]">
              {queueTab === "ongoing"
                ? "No ongoing field tasks match these filters"
                : "No repairs currently awaiting Authority approval"}
            </h2>
            <p className="mt-1 text-xs text-[#475569]">
              {queueTab === "ongoing"
                ? "Switch to Submitted for Approval or reset your regional/department filters."
                : "Open any ongoing task and upload an After-Repair Proof Photo to trigger Gemini AI Verification."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleTasks.map((issue) => (
              <WorkerTaskCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
