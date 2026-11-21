import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ISSUE_STATUSES,
  type DashboardStats,
  type Issue,
  type IssueStatus,
  type StatusHistoryEntry,
} from "@/types/issue";

export {
  buildGoogleMapsUrl,
  formatCoordinates,
  formatDateTime,
  formatFullAddress,
  formatIssuesAsCsv,
  formatIssuesAsJson,
  formatRelativeTime,
  isInlineOrSvgUrl,
  triggerFileDownload,
} from "./formatters";

/**
 * Merges Tailwind CSS classes cleanly without conflicting specificity.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Computes aggregate KPI statistics for a given list of issues in a single pass.
 */
export function computeDashboardStats(issues: Issue[]): DashboardStats {
  const total = issues.length;
  let reported = 0;
  let inProgress = 0;
  let pendingVerification = 0;
  let resolved = 0;
  let critical = 0;

  for (const issue of issues) {
    switch (issue.status) {
      case "Reported":
        reported += 1;
        break;
      case "In Progress":
        inProgress += 1;
        break;
      case "Pending Verification":
        pendingVerification += 1;
        break;
      case "Resolved":
        resolved += 1;
        break;
    }
    if (issue.priority === "Critical" && issue.status !== "Resolved") {
      critical += 1;
    }
  }

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return {
    total,
    reported,
    inProgress,
    pendingVerification,
    resolved,
    critical,
    resolutionRate,
  };
}

/** Visual state of a single municipal lifecycle stage. */
export type LifecycleStageState = "completed" | "current" | "pending";

export interface LifecycleStage {
  status: IssueStatus;
  state: LifecycleStageState;
  /** All status-history entries recorded for this stage, oldest first. */
  entries: StatusHistoryEntry[];
}

/**
 * Always returns all 4 municipal lifecycle stages (`Reported` -> `In Progress` ->
 * `Pending Verification` -> `Resolved`) in order, classifying each as completed, current,
 * or pending based on the issue's status. Resolved is treated as a completed terminal stage.
 */
export function buildLifecycleStages(
  issue: Pick<Issue, "status" | "statusHistory">,
): LifecycleStage[] {
  const currentIndex = ISSUE_STATUSES.indexOf(issue.status);
  return ISSUE_STATUSES.map((status, index) => {
    const entries = issue.statusHistory.filter((e) => e.status === status);
    let state: LifecycleStageState;
    if (
      index < currentIndex ||
      (index === currentIndex && status === "Resolved")
    ) {
      state = "completed";
    } else if (index === currentIndex) {
      state = "current";
    } else {
      state = "pending";
    }
    return { status, state, entries };
  });
}
