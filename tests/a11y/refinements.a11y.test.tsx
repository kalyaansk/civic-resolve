import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { AuthorityReviewPage } from "@/components/admin/AuthorityReviewPage";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PublicDashboard } from "@/components/dashboard/PublicDashboard";
import { IssueDetailView } from "@/components/issues/IssueDetailView";
import { Navbar } from "@/components/layout/Navbar";
import { WorkerDashboard } from "@/components/worker/WorkerDashboard";
import { WorkerTaskDetail } from "@/components/worker/WorkerTaskDetail";
import { SEED_ISSUES } from "@/lib/data/seedIssues";
import { computeDashboardStats } from "@/lib/utils";

function mockSession(payload: Record<string, unknown>) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => payload,
  }) as unknown as typeof fetch;
}

const AUTHORITY_SESSION = {
  authenticated: true,
  authorized: true,
  role: "authority",
  actor: "M. Alvarez (Demo Authority)",
  displayName: "M. Alvarez (Demo Authority)",
  email: "ops.lead@civicresolve.gov",
  uid: "demo-admin",
  isDemo: true,
  demoEnabled: true,
};

const WORKER_SESSION = {
  authenticated: true,
  authorized: false,
  role: "worker",
  actor: "R. Selvam (Demo Field Worker)",
  displayName: "R. Selvam (Demo Field Worker)",
  email: "worker.demo@civicresolve.gov",
  uid: "demo-worker",
  isDemo: true,
  demoEnabled: true,
};

const VISITOR_SESSION = {
  authenticated: false,
  authorized: false,
  role: null,
  demoEnabled: true,
};

function renderDashboard() {
  return render(
    <AuthProvider>
      <main>
        <PublicDashboard
          initialIssues={SEED_ISSUES}
          initialStats={computeDashboardStats(SEED_ISSUES)}
        />
      </main>
    </AuthProvider>,
  );
}

describe("Public Dashboard: Decluttered header KPI strip & Full-Width Split View", () => {
  beforeEach(() => mockSession(VISITOR_SESSION));

  it("defaults to Map + List with a 3-option segmented radiogroup and zero sidebar rail", async () => {
    renderDashboard();
    const group = await screen.findByRole("radiogroup", {
      name: "Issue display mode",
    });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual([
      "Map + List",
      "List Only",
      "Map Only",
    ]);
    expect(
      within(group).getByRole("radio", { name: "Map + List" }),
    ).toHaveAttribute("aria-checked", "true");

    // Sidebar column is gone; compact overview strip is in the header
    expect(
      screen.queryByRole("complementary", { name: "Civic Overview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Select issue CR-/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("region", { name: "Issue list" }),
    ).toBeInTheDocument();
  });

  it("places compact stats (Total/Reported/In Progress/Resolved) and CSV/JSON exports in the top-right overview strip", async () => {
    renderDashboard();
    const strip = await screen.findByRole("region", {
      name: "Civic overview summary and exports",
    });
    for (const label of ["Total", "Reported", "In Progress", "Resolved"]) {
      expect(within(strip).getByText(label)).toBeInTheDocument();
    }
    expect(
      within(strip).getByRole("button", { name: "Export CSV" }),
    ).toBeInTheDocument();
    expect(
      within(strip).getByRole("button", { name: "Export JSON" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Report an Issue/i }),
    ).not.toBeInTheDocument();
  });

  it("switches between List Only and Map Only", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByRole("radiogroup", { name: "Issue display mode" });

    await user.click(screen.getByRole("radio", { name: "List Only" }));
    expect(screen.getByRole("radio", { name: "List Only" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: /Select issue CR-/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("article").length).toBe(SEED_ISSUES.length);

    await user.click(screen.getByRole("radio", { name: "Map Only" }));
    expect(
      screen.getAllByRole("button", { name: /Select issue CR-/i }).length,
    ).toBe(SEED_ISSUES.length);
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("supports arrow-key navigation inside the view switcher", async () => {
    const user = userEvent.setup();
    renderDashboard();
    const split = await screen.findByRole("radio", { name: "Map + List" });
    split.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "List Only" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("focuses the matching map pin when hovering an issue card, and highlights the card when a pin is clicked", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByRole("radiogroup", { name: "Issue display mode" });

    const list = screen.getByRole("region", { name: "Issue list" });
    const cards = within(list).getAllByRole("article");
    const target = cards[2]!;
    await user.hover(target);
    const id = target.id.replace("issue-card-", "");
    const issue = SEED_ISSUES.find((i) => i.id === id)!;
    expect(
      screen.getByRole("button", {
        name: `Select issue ${issue.referenceCode}: ${issue.title}`,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    const other = SEED_ISSUES.find((i) => i.id !== id)!;
    await user.click(
      screen.getByRole("button", {
        name: `Select issue ${other.referenceCode}: ${other.title}`,
      }),
    );
    expect(
      document.getElementById(`issue-card-${other.id}`),
    ).toHaveAttribute("data-selected", "true");
    expect(target).toHaveAttribute("data-selected", "false");
  });

  it("has zero axe violations in Map + List, List Only and Map Only modes", async () => {
    const user = userEvent.setup();
    const { container } = renderDashboard();
    await screen.findByRole("radiogroup", { name: "Issue display mode" });
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("radio", { name: "List Only" }));
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("radio", { name: "Map Only" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Issue Detail: hierarchy, Before & After proof & 4-stage timeline", () => {
  beforeEach(() => mockSession(VISITOR_SESSION));

  const reported = SEED_ISSUES.find((i) => i.status === "Reported")!;
  const inProgress = SEED_ISSUES.find((i) => i.status === "In Progress")!;
  const resolved = SEED_ISSUES.find((i) => i.status === "Resolved")!;

  it("always renders Reported -> In Progress -> Pending Verification -> Resolved in order", async () => {
    render(
      <AuthProvider>
        <main>
          <IssueDetailView initialIssue={reported} />
        </main>
      </AuthProvider>,
    );
    const stages = await screen.findByRole("list", {
      name: "Municipal lifecycle stages",
    });
    const items = within(stages).getAllByRole("listitem");
    expect(items.map((li) => li.getAttribute("data-stage"))).toEqual([
      "Reported",
      "In Progress",
      "Pending Verification",
      "Resolved",
    ]);
    expect(items.map((li) => li.getAttribute("data-state"))).toEqual([
      "current",
      "pending",
      "pending",
      "pending",
    ]);
    expect(items[0]).toHaveAttribute("aria-current", "step");
    expect(within(items[1]!).getByText("Pending")).toBeInTheDocument();
    expect(within(items[2]!).getByText("Pending")).toBeInTheDocument();
  });

  it("distinguishes completed, current and pending stages for an in-progress issue", async () => {
    render(
      <AuthProvider>
        <main>
          <IssueDetailView initialIssue={inProgress} />
        </main>
      </AuthProvider>,
    );
    const stages = await screen.findByRole("list", {
      name: "Municipal lifecycle stages",
    });
    const items = within(stages).getAllByRole("listitem");
    expect(items.map((li) => li.getAttribute("data-state"))).toEqual([
      "completed",
      "current",
      "pending",
      "pending",
    ]);
    expect(within(items[0]!).getByText("Completed")).toBeInTheDocument();
    expect(within(items[1]!).getByText("Current")).toBeInTheDocument();
  });

  it("renders Before & After Resolution Proof and all 4 completed stages for a verified resolved issue", async () => {
    const { container } = render(
      <AuthProvider>
        <main>
          <IssueDetailView initialIssue={resolved} />
        </main>
      </AuthProvider>,
    );
    expect(
      await screen.findByText(/Before & After Resolution Proof/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Verified Fixed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enlarge after-repair resolution proof" }),
    ).toBeInTheDocument();

    const stages = screen.getByRole("list", {
      name: "Municipal lifecycle stages",
    });
    const items = within(stages).getAllByRole("listitem");
    expect(items.map((li) => li.getAttribute("data-state"))).toEqual([
      "completed",
      "completed",
      "completed",
      "completed",
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("orders cards summary -> AI analysis -> evidence/location and opens an accessible photo lightbox", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AuthProvider>
        <main>
          <IssueDetailView initialIssue={inProgress} />
        </main>
      </AuthProvider>,
    );
    const summary = await screen.findByRole("heading", {
      name: "Complaint Summary",
    });
    const analysis = screen.getByRole("heading", {
      name: "Gemini AI Analysis Breakdown",
    });
    const photo = screen.getByRole("heading", { name: "Photo Evidence" });
    const location = screen.getByRole("heading", { name: "Location Preview" });
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(summary, analysis)).toBe(true);
    expect(follows(analysis, photo)).toBe(true);
    expect(follows(photo, location)).toBe(true);

    expect(screen.getByText("Reported By")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open in Google Maps/i }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(
      screen.getByRole("button", { name: "Enlarge photo evidence" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(new RegExp(`#${inProgress.referenceCode}`)),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Close photo viewer" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the full department name without truncation", async () => {
    render(
      <AuthProvider>
        <main>
          <IssueDetailView initialIssue={inProgress} />
        </main>
      </AuthProvider>,
    );
    const badge = await screen.findByTitle(
      `AI recommended department: ${inProgress.department}`,
    );
    expect(badge.textContent).toContain(inProgress.department);
    expect(badge.innerHTML).not.toContain("truncate");
  });
});

describe("Authority Console: Notification Banner, Approval Review & Inspector", () => {
  beforeEach(() => mockSession(AUTHORITY_SESSION));

  async function renderAdmin() {
    const view = render(
      <AuthProvider>
        <main>
          <AdminConsole initialIssues={SEED_ISSUES} />
        </main>
      </AuthProvider>,
    );
    await screen.findByText("Authority Operations Console");
    return view;
  }

  it("displays compact top-right stats, Pending Verification banner link to /admin/review/[id], and Review Completion row links", async () => {
    await renderAdmin();

    const strip = screen.getByRole("region", {
      name: "Operational queue summary",
    });
    for (const label of [
      "Critical",
      "Reported",
      "In Progress",
      "Pending",
      "Resolved",
    ]) {
      expect(within(strip).getByText(label)).toBeInTheDocument();
    }
    expect(
      within(strip).getByRole("button", { name: "Export CSV" }),
    ).toBeInTheDocument();

    const pendingIssue = SEED_ISSUES.find(
      (i) => i.status === "Pending Verification",
    )!;
    const banner = screen.getByRole("status", {
      name: "Pending approval notifications",
    });
    expect(banner.textContent).toContain("Awaiting Authority Approval");
    expect(
      within(banner).getByRole("link", { name: /Review Pending Approvals/i }),
    ).toHaveAttribute("href", `/admin/review/${pendingIssue.id}`);

    const reviewLinks = screen.getAllByRole("link", {
      name: /Review Completion/i,
    });
    expect(reviewLinks[0]).toHaveAttribute(
      "href",
      `/admin/review/${pendingIssue.id}`,
    );
  });

  it("renders a confirmation banner when redirected back from /admin/review/[id]", async () => {
    render(
      <AuthProvider>
        <main>
          <AdminConsole
            initialIssues={SEED_ISSUES}
            initialBanner={{ updated: "CR-2026-0412", decision: "approved" }}
          />
        </main>
      </AuthProvider>,
    );
    expect(
      await screen.findByText(/Completion approved for #CR-2026-0412/i),
    ).toBeInTheDocument();
  });

  it("selects an issue by clicking anywhere on its row and updates the inspector", async () => {
    const user = userEvent.setup();
    await renderAdmin();
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    const second = rows[1]!;
    const secondIssue = SEED_ISSUES.find((i) =>
      second.textContent?.includes(`#${i.referenceCode}`),
    )!;

    await user.click(
      within(second).getByText(secondIssue.location.address, { exact: false }),
    );
    expect(second).toHaveAttribute("data-selected", "true");
    expect(
      screen.getByRole("complementary", {
        name: `Operations Inspector for issue ${secondIssue.referenceCode}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View Full Page/i }),
    ).toHaveAttribute("href", `/issues/${secondIssue.id}`);
  });

  it("renders read-only department/status pills in rows (no inline selects) with a quick View link", async () => {
    await renderAdmin();
    const table = screen.getByRole("table");
    expect(table.querySelector("select")).toBeNull();
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.length).toBe(SEED_ISSUES.length);
    for (const row of rows) {
      expect(
        within(row).getAllByRole("link", { name: /#CR-|full page/i }).length,
      ).toBeGreaterThanOrEqual(2);
    }
    expect(
      screen.getAllByTitle(SEED_ISSUES[0]!.department).length,
    ).toBeGreaterThan(0);
  });

  it("changes 4-stage status and priority through accessible radiogroups", async () => {
    const user = userEvent.setup();
    await renderAdmin();

    const statusGroup = screen.getByRole("radiogroup", { name: "Update Status" });
    expect(within(statusGroup).getAllByRole("radio")).toHaveLength(4);
    await user.click(
      within(statusGroup).getByRole("radio", { name: "Pending Verification" }),
    );
    expect(
      within(statusGroup).getByRole("radio", { name: "Pending Verification" }),
    ).toHaveAttribute("aria-checked", "true");

    const priorityGroup = screen.getByRole("radiogroup", {
      name: "Priority Level",
    });
    expect(
      within(priorityGroup)
        .getAllByRole("radio")
        .map((r) => r.textContent),
    ).toEqual(["Low", "Medium", "High", "Critical"]);
    await user.click(within(priorityGroup).getByRole("radio", { name: "Low" }));
    expect(
      within(priorityGroup).getByRole("radio", { name: "Low" }),
    ).toHaveAttribute("aria-checked", "true");

    expect(screen.queryByRole("combobox", { name: "Update Status" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Priority Level" })).toBeNull();
    expect(
      screen.getByRole("combobox", { name: "Reassign Department" }),
    ).toBeInTheDocument();
  });

  it("populates and appends quick-fill note chips", async () => {
    const user = userEvent.setup();
    await renderAdmin();
    const note = screen.getByLabelText(
      /Public Resolution Note/i,
    ) as HTMLTextAreaElement;
    await user.clear(note);

    await user.click(
      screen.getByRole("button", { name: /Field crew dispatched/i }),
    );
    expect(note.value).toBe("Field crew dispatched.");

    await user.click(
      screen.getByRole("button", { name: /Repair completed & verified/i }),
    );
    expect(note.value).toBe(
      "Field crew dispatched. Repair completed & verified.",
    );

    // Idempotent: re-clicking same chip avoids duplicate text
    await user.click(
      screen.getByRole("button", { name: /Field crew dispatched/i }),
    );
    expect(note.value).toBe(
      "Field crew dispatched. Repair completed & verified.",
    );
  });

  it("shows recent activity, reporter, full location and Gemini reasoning in the inspector", async () => {
    await renderAdmin();
    const inspector = screen.getByRole("complementary", {
      name: /Operations Inspector for issue/i,
    });
    expect(within(inspector).getByText("Recent Activity")).toBeInTheDocument();
    expect(within(inspector).getByText("Reported By")).toBeInTheDocument();
    expect(
      within(inspector).getByText("Gemini AI Reasoning"),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByRole("link", { name: /Open in Google Maps/i }),
    ).toBeInTheDocument();
  });

  it("has zero axe violations with the inspector open", async () => {
    const { container } = await renderAdmin();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Authority Review Page (/admin/review/[id])", () => {
  beforeEach(() => mockSession(AUTHORITY_SESSION));

  it("displays side-by-side Before/After evidence, multi-pending switcher, Gemini report, and approval controls", async () => {
    const pendingIssue = SEED_ISSUES.find(
      (i) => i.status === "Pending Verification",
    )!;
    render(
      <AuthProvider>
        <main>
          <AuthorityReviewPage
            initialIssue={pendingIssue}
            pendingIds={[pendingIssue.id, "cr-2026-0418"]}
          />
        </main>
      </AuthProvider>,
    );

    expect(
      await screen.findByText("Authority Approval Decision"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 of 2 pending")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Authority Console/i }),
    ).toHaveAttribute("href", "/admin");
    expect(screen.getByText("Before — Citizen Report")).toBeInTheDocument();
    expect(screen.getByText("After — Field Worker Proof")).toBeInTheDocument();
    expect(
      screen.getByText("Gemini AI Verification Report"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Approve & Mark Resolved/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Request Rework \(Return to Worker\)/i,
      }),
    ).toBeInTheDocument();
  });
});

describe("Field Worker Portal (/worker) & Dedicated Task Page (/worker/tasks/[id])", () => {
  beforeEach(() => mockSession(WORKER_SESSION));

  it("renders full-width ongoing task cards linking to /worker/tasks/[id] without a cramped side panel", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <main>
          <WorkerDashboard initialIssues={SEED_ISSUES} />
        </main>
      </AuthProvider>,
    );

    await screen.findByText("Field Worker Task Portal");
    const ongoing = SEED_ISSUES.filter(
      (i) => i.status === "Reported" || i.status === "In Progress",
    );
    expect(screen.getAllByRole("article")).toHaveLength(ongoing.length);
    const resolvedIssue = SEED_ISSUES.find((i) => i.status === "Resolved")!;
    expect(screen.queryByText(resolvedIssue.title)).not.toBeInTheDocument();

    // No right-hand Field Execution Panel on /worker list
    expect(
      screen.queryByRole("complementary", { name: /Field Execution Panel/i }),
    ).not.toBeInTheDocument();

    // Cards link directly to /worker/tasks/[id]
    const firstOngoing = [...ongoing].sort(
      (a, b) => b.urgencyScore - a.urgencyScore,
    )[0]!;
    expect(
      screen.getByRole("link", { name: firstOngoing.title }),
    ).toHaveAttribute("href", `/worker/tasks/${firstOngoing.id}`);

    await user.click(
      screen.getByRole("radio", { name: /Submitted for Approval/i }),
    );
    const pendingIssue = SEED_ISSUES.find(
      (i) => i.status === "Pending Verification",
    )!;
    expect(
      screen.getByRole("link", { name: pendingIssue.title }),
    ).toHaveAttribute("href", `/worker/tasks/${pendingIssue.id}`);
  });

  it("surfaces inline field and submit validation errors on /worker/tasks/[id] and supports quick-fill summary chips", async () => {
    const user = userEvent.setup();
    const reportedIssue = SEED_ISSUES.find((i) => i.status === "Reported")!;
    render(
      <AuthProvider>
        <main>
          <WorkerTaskDetail initialIssue={reportedIssue} />
        </main>
      </AuthProvider>,
    );

    await screen.findByText("Start On-Site Repair Work");
    await user.click(
      screen.getByRole("button", {
        name: /Submit & Generate Gemini AI Report/i,
      }),
    );

    // Inline errors appear immediately next to photo, textarea, and submit button
    expect(
      screen.getByText(/After-Repair Proof Photo is required/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/at least 10 characters/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please fix the highlighted fields above/i),
    ).toBeInTheDocument();

    // Quick-fill chip populates Work Completion Summary
    await user.click(
      screen.getByRole("button", { name: /Hazard cleared and area secured/i }),
    );
    const textarea = screen.getByLabelText(
      /Work Completion Summary/i,
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Hazard cleared and area secured.");
  });
});

describe("Logged-out Navbar & 3-Tab Access Portal", () => {
  beforeEach(() => mockSession(VISITOR_SESSION));

  it("shows Report an Issue, Field Worker, Authority buttons and places demo logins at the top of each tab", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Navbar />
      </AuthProvider>,
    );

    const fieldWorkerBtn = await screen.findByRole("button", {
      name: "Field Worker",
    });
    expect(
      screen.getByRole("button", { name: /Report an Issue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Authority" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign In" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Register" }),
    ).not.toBeInTheDocument();

    await user.click(fieldWorkerBtn);
    const dialog = await screen.findByRole("dialog");
    const tabList = within(dialog).getByRole("tablist");
    const tabs = within(tabList).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Citizen",
      "Field Worker",
      "Authority",
    ]);

    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    // Worker tab leads with Demo Field Worker Login
    const demoWorkerBtn = within(dialog).getByRole("button", {
      name: "Demo Field Worker Login",
    });
    expect(follows(tabList, demoWorkerBtn)).toBe(true);
    expect(
      follows(
        demoWorkerBtn,
        within(dialog).getByText("Official Field Worker Access Only"),
      ),
    ).toBe(true);

    // Citizen tab leads with Demo Citizen Login
    await user.click(within(tabList).getByRole("tab", { name: "Citizen" }));
    const demoCitizenBtn = within(dialog).getByRole("button", {
      name: "Demo Citizen Login",
    });
    expect(follows(tabList, demoCitizenBtn)).toBe(true);
    expect(
      follows(demoCitizenBtn, within(dialog).getByText("Citizen Sign In")),
    ).toBe(true);

    // Authority tab leads with Evaluator / Demo Authority Access
    await user.click(within(tabList).getByRole("tab", { name: "Authority" }));
    const demoAuthBtn = within(dialog).getByRole("button", {
      name: "Evaluator / Demo Authority Access",
    });
    expect(follows(tabList, demoAuthBtn)).toBe(true);
    expect(
      follows(demoAuthBtn, within(dialog).getByText("Official Sign-In Only")),
    ).toBe(true);
  });
});
