"use client";

import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileCheck2,
  Lock,
  MapPin,
  Search,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CompletionVerdictBadge,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui/Badges";
import { RadioPills, type RadioPillOption } from "@/components/ui/RadioPills";
import { MUNICIPAL_DEPARTMENTS, type Issue } from "@/types/issue";

interface WorkerDashboardProps {
  initialIssues: Issue[];
}

type WorkerQueueTab = "ongoing" | "pending";

function isInlineOrSvgUrl(src: string): boolean {
  return (
    src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg")
  );
}

export function WorkerDashboard({ initialIssues }: WorkerDashboardProps) {
  const {
    user,
    loading,
    demoEnabled,
    signInDemoWorker,
    openSignInDialog,
  } = useAuth();

  const [queueTab, setQueueTab] = useState<WorkerQueueTab>("ongoing");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const isWorker = user?.role === "worker";

  const ongoingCount = useMemo(
    () =>
      initialIssues.filter(
        (i) => i.status === "Reported" || i.status === "In Progress",
      ).length,
    [initialIssues],
  );

  const pendingCount = useMemo(
    () =>
      initialIssues.filter((i) => i.status === "Pending Verification").length,
    [initialIssues],
  );

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
    const q = search.trim().toLowerCase();
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
  }, [initialIssues, queueTab, stateFilter, cityFilter, departmentFilter, search]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-12">
        <p className="text-sm font-medium text-[#475569]">
          Verifying Field Worker session...
        </p>
      </div>
    );
  }

  // Citizen or Authority trying to access /worker -> strict 403 Restricted screen
  if (user && !isWorker) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <section
          role="alert"
          className="rounded-2xl border border-[#FECACA] bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#991B1B]">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#991B1B]">
            HTTP 403 • Access Denied
          </p>
          <h1 className="mt-1 font-headline text-2xl font-bold text-[#0F172A]">
            403 Restricted — Field Workers Only
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            You are signed in as{" "}
            <strong>
              {user.role === "authority" ? "Municipal Authority" : "Citizen"}
            </strong>{" "}
            ({user.displayName}). On-site repair execution and after-repair
            proof uploads are restricted to pre-authorized Field Crew accounts.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user.role === "authority" ? "/admin" : "/"}
              className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
            >
              {user.role === "authority"
                ? "Go to Authority Console"
                : "Return to Explore Issues"}
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              View Public Feed
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Unauthenticated Visitor -> Field Worker Auth gate
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#92400E] text-white">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#0F172A]">
                Field Worker Authentication Required
              </h1>
              <p className="text-sm text-[#475569]">
                Sign in with a Field Crew account to execute repairs and upload
                after-repair proof photos.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#334155]">
            Authenticated Field Workers see assigned ongoing municipal defects,
            open dedicated task execution screens, and upload after-repair proof
            for instant Gemini AI before-vs-after verification prior to
            Authority approval.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {demoEnabled && (
              <button
                type="button"
                onClick={() => void signInDemoWorker()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#92400E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#78350F]"
              >
                <Wrench className="h-4 w-4" aria-hidden="true" />
                Demo Field Worker Login
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                openSignInDialog({
                  tab: "worker",
                  mode: "signin",
                  returnTo: "/worker",
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              Official Worker Sign-In
            </button>
          </div>
        </section>
      </div>
    );
  }

  const queueTabOptions: readonly RadioPillOption<WorkerQueueTab>[] = [
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
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12">
      {/* Header */}
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

      {/* Search & Regional / Department Filter Bar */}
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

      {/* Full-Width Task Cards Grid */}
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
            {visibleTasks.map((issue) => {
              const thumbSrc = issue.photoUrl || "/images/issues/pothole.svg";
              return (
                <article
                  key={issue.id}
                  className="group flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:border-[#1B365D]/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1B365D]">
                          #{issue.referenceCode}
                        </span>
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#0F766E]">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Urgency {issue.urgencyScore} / 100
                      </span>
                    </div>

                    <div className="mt-3 flex gap-3.5">
                      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]">
                        <Image
                          src={thumbSrc}
                          alt={issue.photoAltText || issue.title}
                          fill
                          unoptimized={isInlineOrSvgUrl(thumbSrc)}
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-headline text-base font-bold text-[#0F172A] group-hover:text-[#0369A1]">
                          <Link
                            href={`/worker/tasks/${issue.id}`}
                            className="hover:underline"
                          >
                            {issue.title}
                          </Link>
                        </h2>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#475569]">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    {issue.status === "Pending Verification" &&
                      issue.completionReport && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#99EFE5] bg-[#F0FDFA] px-3 py-2 text-xs">
                          <CompletionVerdictBadge
                            verdict={
                              issue.completionReport.aiVerification.verdict
                            }
                          />
                          <span className="font-bold tabular-nums text-[#0F766E]">
                            {issue.completionReport.aiVerification.confidence}%
                            AI Confidence
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-3.5">
                    <div className="min-w-0 space-y-1 text-xs text-[#475569]">
                      <p className="flex items-center gap-1 truncate font-medium text-[#0F172A]">
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0 text-[#0369A1]"
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {issue.location.address} • {issue.city}, {issue.state}
                        </span>
                      </p>
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-[#1B365D]">
                        <Building2
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {issue.department}
                      </p>
                    </div>

                    <Link
                      href={`/worker/tasks/${issue.id}`}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
                        issue.status === "Pending Verification"
                          ? "border border-[#5B21B6] bg-[#F5F3FF] text-[#5B21B6] hover:bg-[#EDE9FE]"
                          : "bg-[#1B365D] text-white hover:bg-[#002046]"
                      }`}
                    >
                      {issue.status === "Pending Verification"
                        ? "View AI Report"
                        : "Open Task"}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
