import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { AuthorityReviewPage } from "@/components/admin/AuthorityReviewPage";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PublicDashboard } from "@/components/dashboard/PublicDashboard";
import { IssueDetailView } from "@/components/issues/IssueDetailView";
import { MyIssuesView } from "@/components/issues/MyIssuesView";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { GeminiTriageCard } from "@/components/report/GeminiTriageCard";
import { ReportIssueForm } from "@/components/report/ReportIssueForm";
import {
  AIDepartmentBadge,
  CompletionVerdictBadge,
  PriorityBadge,
  StatusBadge,
  UrgencyMeter,
} from "@/components/ui/Badges";
import { WorkerDashboard } from "@/components/worker/WorkerDashboard";
import { WorkerTaskDetail } from "@/components/worker/WorkerTaskDetail";
import { buildRejectedTriageResult } from "@/lib/ai/fallback";
import { SEED_ISSUES } from "@/lib/data/seedIssues";
import { computeDashboardStats } from "@/lib/utils";
import type {
  CompletionVerdict,
  IssuePriority,
  IssueStatus,
} from "@/types/issue";

function mockSessionResponse(payload: Record<string, unknown>) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => payload,
  }) as unknown as typeof fetch;
}

describe("WCAG 2.1 AA Automated Accessibility (vitest-axe)", () => {
  beforeEach(() => {
    mockSessionResponse({
      authenticated: false,
      authorized: false,
      role: null,
      demoEnabled: true,
    });
  });

  it("Navbar and Footer have zero axe accessibility violations", async () => {
    const { container, findAllByRole } = render(
      <AuthProvider>
        <Navbar />
        <main id="main-content">
          <h1>CivicResolve</h1>
        </main>
        <Footer />
      </AuthProvider>,
    );

    await findAllByRole("button", { name: "Authority" });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("StatusBadge, PriorityBadge, CompletionVerdictBadge, AIDepartmentBadge, and UrgencyMeter have zero axe violations", async () => {
    const { container } = render(
      <main>
        <StatusBadge status="Reported" />
        <StatusBadge status="In Progress" />
        <StatusBadge status="Pending Verification" />
        <StatusBadge status="Resolved" />
        <PriorityBadge priority="Critical" />
        <PriorityBadge priority="High" />
        <PriorityBadge priority="Medium" />
        <PriorityBadge priority="Low" />
        <CompletionVerdictBadge verdict="Verified Fixed" />
        <CompletionVerdictBadge verdict="Partially Fixed" />
        <CompletionVerdictBadge verdict="Needs Re-Inspection" />
        <AIDepartmentBadge department="Public Works — Road Maintenance" />
        <UrgencyMeter score={84} />
      </main>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("StatusBadge, PriorityBadge, and CompletionVerdictBadge render safely without throwing on unexpected runtime strings", () => {
    const { getByText } = render(
      <main>
        <StatusBadge status={"Legacy Status" as IssueStatus} />
        <PriorityBadge priority={"Urgent" as IssuePriority} />
        <CompletionVerdictBadge verdict={"Unknown Verdict" as CompletionVerdict} />
      </main>,
    );

    expect(getByText("Legacy Status")).toBeInTheDocument();
    expect(getByText("Urgent")).toBeInTheDocument();
    expect(getByText("Unknown Verdict")).toBeInTheDocument();
  });

  it("PublicDashboard has zero axe accessibility violations", async () => {
    const { container, findByText } = render(
      <AuthProvider>
        <main>
          <PublicDashboard
            initialIssues={SEED_ISSUES}
            initialStats={computeDashboardStats(SEED_ISSUES)}
          />
        </main>
      </AuthProvider>,
    );

    await findByText("Public Issue Tracking Dashboard");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ReportIssueForm (clean initial idle state) has zero axe accessibility violations", async () => {
    const { container, findByText } = render(
      <AuthProvider>
        <main>
          <h1>Report a Civic Issue</h1>
          <ReportIssueForm />
        </main>
      </AuthProvider>,
    );

    await findByText("Ready for Live Analysis");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("IssueDetailView has zero axe accessibility violations", async () => {
    const { container, findByText } = render(
      <AuthProvider>
        <main>
          <IssueDetailView initialIssue={SEED_ISSUES[1]!} />
        </main>
      </AuthProvider>,
    );

    await findByText("Tracking Timeline");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("MyIssuesView (authenticated Citizen) has zero axe accessibility violations", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/auth/session")) {
        return {
          ok: true,
          json: async () => ({
            authenticated: true,
            authorized: false,
            role: "citizen",
            actor: "Aarav K. (Demo Citizen)",
            displayName: "Aarav K. (Demo Citizen)",
            email: "citizen.demo@civicresolve.gov",
            uid: "demo-citizen",
            isDemo: true,
            demoEnabled: true,
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          issues: [SEED_ISSUES[1]!],
        }),
      };
    }) as unknown as typeof fetch;

    const { container, findByText } = render(
      <AuthProvider>
        <main>
          <MyIssuesView />
        </main>
      </AuthProvider>,
    );

    await findByText(SEED_ISSUES[1]!.title);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WorkerDashboard renders accessible 403 Restricted screen for Citizens and accessible Task Portal for Field Workers", async () => {
    mockSessionResponse({
      authenticated: true,
      authorized: false,
      role: "citizen",
      actor: "Aarav K. (Demo Citizen)",
      displayName: "Aarav K. (Demo Citizen)",
      email: "citizen.demo@civicresolve.gov",
      uid: "demo-citizen",
      isDemo: true,
      demoEnabled: true,
    });

    const citizenView = render(
      <AuthProvider>
        <main>
          <WorkerDashboard initialIssues={SEED_ISSUES} />
        </main>
      </AuthProvider>,
    );
    await citizenView.findByText("403 Restricted — Field Workers Only");
    expect(await axe(citizenView.container)).toHaveNoViolations();
    citizenView.unmount();

    mockSessionResponse({
      authenticated: true,
      authorized: false,
      role: "worker",
      actor: "R. Selvam (Demo Field Worker)",
      displayName: "R. Selvam (Demo Field Worker)",
      email: "worker.demo@civicresolve.gov",
      uid: "demo-worker",
      isDemo: true,
      demoEnabled: true,
    });

    const workerView = render(
      <AuthProvider>
        <main>
          <WorkerDashboard initialIssues={SEED_ISSUES} />
        </main>
      </AuthProvider>,
    );
    await workerView.findByText("Field Worker Task Portal");
    expect(await axe(workerView.container)).toHaveNoViolations();
  });

  it("AdminConsole renders accessible 403 Restricted screen for Citizens and accessible Authority table for Authorities", async () => {
    mockSessionResponse({
      authenticated: true,
      authorized: false,
      role: "citizen",
      actor: "Aarav K. (Demo Citizen)",
      displayName: "Aarav K. (Demo Citizen)",
      email: "citizen.demo@civicresolve.gov",
      uid: "demo-citizen",
      isDemo: true,
      demoEnabled: true,
    });

    const citizenView = render(
      <AuthProvider>
        <main>
          <AdminConsole initialIssues={SEED_ISSUES} />
        </main>
      </AuthProvider>,
    );
    await citizenView.findByText("403 Restricted — Municipal Authorities Only");
    expect(await axe(citizenView.container)).toHaveNoViolations();
    citizenView.unmount();

    mockSessionResponse({
      authenticated: true,
      authorized: true,
      role: "authority",
      actor: "M. Alvarez (Demo Authority)",
      displayName: "M. Alvarez (Demo Authority)",
      email: "ops.lead@civicresolve.gov",
      uid: "demo-admin",
      isDemo: true,
      demoEnabled: true,
    });

    const authorityView = render(
      <AuthProvider>
        <main>
          <AdminConsole initialIssues={SEED_ISSUES} />
        </main>
      </AuthProvider>,
    );
    await authorityView.findByText("Authority Operations Console");
    expect(await axe(authorityView.container)).toHaveNoViolations();
  });

  it("GeminiTriageCard renders an accessible alert when an off-topic or injected report is rejected", async () => {
    const rejected = buildRejectedTriageResult(
      "This input appears to be a math question rather than a municipal infrastructure issue.",
      false,
    );
    const { container, getByText } = render(
      <main>
        <GeminiTriageCard analysis={rejected} analyzing={false} />
      </main>,
    );

    expect(
      getByText("Off-Topic or Invalid Civic Report Detected"),
    ).toBeInTheDocument();
    expect(getByText("Blocked / Off-Topic")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("WorkerTaskDetail has zero axe violations for Field Workers on active and submitted tasks", async () => {
    mockSessionResponse({
      authenticated: true,
      authorized: false,
      role: "worker",
      actor: "R. Selvam (Demo Field Worker)",
      displayName: "R. Selvam (Demo Field Worker)",
      email: "worker.demo@civicresolve.gov",
      uid: "demo-worker",
      isDemo: true,
      demoEnabled: true,
    });

    const ongoingIssue = SEED_ISSUES.find((i) => i.status === "Reported")!;
    const activeView = render(
      <AuthProvider>
        <main>
          <WorkerTaskDetail initialIssue={ongoingIssue} />
        </main>
      </AuthProvider>,
    );
    await activeView.findByText("Start On-Site Repair Work");
    expect(await axe(activeView.container)).toHaveNoViolations();
    activeView.unmount();

    const pendingIssue = SEED_ISSUES.find(
      (i) => i.status === "Pending Verification",
    )!;
    const submittedView = render(
      <AuthProvider>
        <main>
          <WorkerTaskDetail initialIssue={pendingIssue} />
        </main>
      </AuthProvider>,
    );
    await submittedView.findByText(
      "Report Sent to Municipal Authority for Approval",
    );
    expect(await axe(submittedView.container)).toHaveNoViolations();
  });

  it("AuthorityReviewPage has zero axe violations for Municipal Authorities", async () => {
    mockSessionResponse({
      authenticated: true,
      authorized: true,
      role: "authority",
      actor: "M. Alvarez (Demo Authority)",
      displayName: "M. Alvarez (Demo Authority)",
      email: "ops.lead@civicresolve.gov",
      uid: "demo-admin",
      isDemo: true,
      demoEnabled: true,
    });

    const pendingIssue = SEED_ISSUES.find(
      (i) => i.status === "Pending Verification",
    )!;
    const { container, findByText } = render(
      <AuthProvider>
        <main>
          <AuthorityReviewPage
            initialIssue={pendingIssue}
            pendingIds={[pendingIssue.id, "cr-2026-0418"]}
          />
        </main>
      </AuthProvider>,
    );
    await findByText("Authority Approval Decision");
    expect(await axe(container)).toHaveNoViolations();
  });
});
