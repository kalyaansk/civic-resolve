import { expect, test } from "@playwright/test";

// Minimal valid 1x1 PNG buffer for E2E after-repair proof upload
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

test.describe("CivicResolve 3-Role Portal, Prompt Defense & Dedicated Task/Review Workflows", () => {
  test("Public visitor sees clear 3-role entry navbar, top-right overview strip, full-width Split View, and 3-tab Access Portal", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Public Issue Tracking Dashboard" }),
    ).toBeVisible();

    const primaryNav = page.getByRole("navigation", {
      name: "Primary navigation",
    });
    await expect(
      primaryNav.getByRole("link", { name: "Track Issues" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Report an Issue/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Field Worker" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Authority" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Register" })).toHaveCount(0);

    // Top-right compact overview strip replaces right sidebar rail
    await expect(
      page.getByRole("complementary", { name: "Civic Overview" }),
    ).toHaveCount(0);
    const overviewStrip = page.getByRole("region", {
      name: "Civic overview summary and exports",
    });
    await expect(overviewStrip.getByText("Total")).toBeVisible();
    await expect(
      overviewStrip.getByRole("button", { name: "Export CSV" }),
    ).toBeVisible();
    await expect(
      overviewStrip.getByRole("button", { name: "Export JSON" }),
    ).toBeVisible();

    // Cascading State -> City regional filter
    await page.getByLabel("Filter by State").selectOption("Tamil Nadu");
    await page.getByLabel("Filter by City").selectOption("Coimbatore");
    await expect(
      page.getByRole("link", {
        name: "Deep pothole near RS Puram DB Road bus stop",
      }),
    ).toBeVisible();

    // Split View (Map + List) is default: map + issue list
    const viewSwitcher = page.getByRole("radiogroup", {
      name: "Issue display mode",
    });
    await expect(
      viewSwitcher.getByRole("radio", { name: "Map + List" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("region", { name: "Issue list" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /View Issue Details/i }),
    ).toBeVisible();

    // Map Only / List Only switching
    await viewSwitcher.getByRole("radio", { name: "Map Only" }).click();
    await expect(
      page.getByRole("region", { name: "Issue list" }),
    ).toHaveCount(0);
    await viewSwitcher.getByRole("radio", { name: "List Only" }).click();
    await expect(
      page.getByRole("link", { name: /View Issue Details/i }),
    ).toHaveCount(0);

    // Unauthenticated upvote opens 3-tab Access Portal with demo logins at top
    await page
      .getByRole("button", { name: /Upvote issue CR-2026-0418/i })
      .click();
    await expect(
      page.getByRole("heading", { name: "CivicResolve Access Portal" }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("tabpanel")
        .getByRole("button", { name: "Demo Citizen Login" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Field Worker" }).click();
    await expect(
      page
        .getByRole("tabpanel")
        .getByRole("button", { name: "Demo Field Worker Login" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Authority" }).click();
    await expect(
      page
        .getByRole("tabpanel")
        .getByRole("button", { name: /Evaluator \/ Demo Authority Access/i }),
    ).toBeVisible();
  });

  test("Prompt injection & off-topic queries on /report are blocked in Gemini AI Triage and rejected on submit (HTTP 400)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Report an Issue/i }).first().click();
    await page.getByRole("button", { name: "Demo Citizen Login" }).click();
    await expect(page).toHaveURL(/\/report$/, { timeout: 10_000 });

    await page.getByLabel(/Issue Title/i).fill("Quick math problem test");
    await page
      .getByLabel(/Detailed Description/i)
      .fill("solve this problem what is 1+1");
    await page.locator("#issue-address").fill("100 Feet Road, Gandhipuram");
    await page.locator("#issue-city").fill("Coimbatore");
    await page.locator("#issue-state").fill("Tamil Nadu");

    // Live triage preview flags as Off-Topic / Blocked with zero fabricated civic score
    await expect(
      page.getByText("Off-Topic or Invalid Civic Report Detected"),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Blocked / Off-Topic")).toBeVisible();

    // Submitting returns HTTP 400 and stays on /report with inline alert
    await page.getByRole("button", { name: /Submit Issue Report/i }).click();
    await expect(page).toHaveURL(/\/report$/);
    await expect(
      page.locator("form").getByRole("alert"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Citizen reports valid issue, tracks 4 stages, gets 403 on /worker and /admin, and Sign Out redirects to /", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Report an Issue/i }).first().click();
    await page.getByRole("button", { name: "Demo Citizen Login" }).click();

    await expect(page).toHaveURL(/\/report$/, { timeout: 10_000 });
    await expect(page.locator("#issue-address")).toHaveValue("");
    await expect(page.locator("#issue-city")).toHaveValue("");
    await expect(page.locator("#issue-state")).toHaveValue("");
    await expect(page.getByText("Ready for Live Analysis")).toBeVisible();

    const primaryNav = page.getByRole("navigation", {
      name: "Primary navigation",
    });
    await expect(
      primaryNav.getByRole("link", { name: "Explore Issues" }),
    ).toBeVisible();
    await expect(
      primaryNav.getByRole("link", { name: "My Reported Issues" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Authority Console|Field Tasks/i }),
    ).toHaveCount(0);

    const uniqueTitle = `Broken footpath ramp near Gandhipuram (${Date.now()})`;
    await page.getByLabel(/Issue Title/i).fill(uniqueTitle);
    await page
      .getByLabel(/Detailed Description/i)
      .fill(
        "Concrete kerb ramp slab is cracked and raised near the bus boarding bay, blocking wheelchair access.",
      );
    await page.locator("#issue-address").fill("100 Feet Road, Gandhipuram");
    await page.locator("#issue-city").fill("Coimbatore");
    await page.locator("#issue-state").fill("Tamil Nadu");
    await page.locator("#issue-district").fill("Gandhipuram");

    await page.getByRole("button", { name: /Submit Issue Report/i }).click();
    await expect(page).toHaveURL(/\/issues\/cr-2026-/, { timeout: 15_000 });

    const stages = page
      .getByRole("list", { name: "Municipal lifecycle stages" })
      .getByRole("listitem");
    await expect(stages).toHaveCount(4);
    await expect(stages.nth(0)).toHaveAttribute("data-stage", "Reported");
    await expect(stages.nth(0)).toHaveAttribute("data-state", "current");
    await expect(stages.nth(1)).toHaveAttribute("data-state", "pending");
    await expect(stages.nth(2)).toHaveAttribute("data-state", "pending");
    await expect(stages.nth(3)).toHaveAttribute("data-state", "pending");

    const upvoteBtn = page.getByRole("button", { name: /Upvotes/i });
    await expect(upvoteBtn).toContainText("1 Upvotes");
    await upvoteBtn.click();
    await expect(upvoteBtn).toContainText("0 Upvotes");
    await upvoteBtn.click();
    await expect(upvoteBtn).toContainText("1 Upvotes");

    await page.goto("/my-issues");
    await expect(page.getByText(uniqueTitle)).toBeVisible();

    // Citizen sees 403 Restricted on /worker and /admin
    await page.goto("/worker");
    await expect(
      page.getByRole("heading", {
        name: "403 Restricted — Field Workers Only",
      }),
    ).toBeVisible();

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", {
        name: "403 Restricted — Municipal Authorities Only",
      }),
    ).toBeVisible();

    // Signing out from /admin redirects cleanly to /
    await page.getByRole("button", { name: /Sign Out/i }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Public Issue Tracking Dashboard" }),
    ).toBeVisible();
  });

  test("Closed-loop workflow: Citizen reports -> Worker /worker/tasks/[id] + AI Report -> Sign Out to / -> Authority /admin/review/[id] -> Redirect to /admin full queue -> Public Before & After", async ({
    page,
  }) => {
    test.slow();

    // 1. Citizen files a dedicated Chennai test complaint
    await page.goto("/");
    await page.getByRole("button", { name: /Report an Issue/i }).first().click();
    await page.getByRole("button", { name: "Demo Citizen Login" }).click();
    await expect(page).toHaveURL(/\/report$/, { timeout: 10_000 });

    const loopTitle = `Closed-loop streetlight outage Adyar (${Date.now()})`;
    await page.getByLabel(/Issue Title/i).fill(loopTitle);
    await page
      .getByLabel(/Detailed Description/i)
      .fill(
        "Two pedestrian LED lamps outside Adyar bus terminus are unlit due to an open feeder panel.",
      );
    await page.locator("#issue-address").fill("LB Road, Adyar Signal");
    await page.locator("#issue-city").fill("Chennai");
    await page.locator("#issue-state").fill("Tamil Nadu");
    await page.locator("#issue-district").fill("Adyar");

    await page.getByRole("button", { name: /Submit Issue Report/i }).click();
    await expect(page).toHaveURL(/\/issues\/cr-2026-/, { timeout: 15_000 });
    const issuePath = new URL(page.url()).pathname;
    const issueId = issuePath.split("/").pop()!;

    // Citizen signs out -> immediately lands on /
    await page.getByRole("button", { name: /Sign Out/i }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: "Field Worker" }).first(),
    ).toBeVisible();

    // 2. Field Worker logs in -> /worker -> opens dedicated /worker/tasks/[id]
    await page.getByRole("button", { name: "Field Worker" }).first().click();
    await page
      .getByRole("button", { name: "Demo Field Worker Login" })
      .click();
    await expect(page).toHaveURL(/\/worker$/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Field Worker Task Portal" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Report an Issue|Authority Console/i }),
    ).toHaveCount(0);

    await page.getByLabel("Filter by State").selectOption("Tamil Nadu");
    await page.getByLabel("Filter by City").selectOption("Chennai");
    await page.getByRole("link", { name: loopTitle }).click();

    // Dedicated Field Task Execution page
    await expect(page).toHaveURL(new RegExp(`/worker/tasks/${issueId}$`), {
      timeout: 10_000,
    });

    // Step 1: Start On-Site Work
    await page.getByRole("button", { name: /Start On-Site Work/i }).click();
    await expect(page.getByText(/Status updated to In Progress/i)).toBeVisible();

    // Step 2: Upload After-Repair photo + completion note & submit for Gemini AI Report
    await page.locator("#worker-after-photo").setInputFiles({
      name: "after-repair.png",
      mimeType: "image/png",
      buffer: VALID_PNG_BUFFER,
    });
    await page
      .getByLabel(/Work Completion Summary/i)
      .fill(
        "Replaced faulty relay contractor inside feeder pillar and verified both LED fixtures illuminated safely.",
      );
    await page
      .getByRole("button", { name: /Submit & Generate Gemini AI Report/i })
      .click();

    // Step 3: Live Gemini AI Verification Report renders right on /worker/tasks/[id]
    await expect(
      page.getByText("Report Sent to Municipal Authority for Approval"),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText("Gemini AI Verification Report"),
    ).toBeVisible();

    // Return to Field Tasks & verify task moved to Submitted for Approval
    await page.getByRole("link", { name: /Return to Field Tasks/i }).click();
    await expect(page).toHaveURL(/\/worker$/, { timeout: 10_000 });
    await page
      .getByRole("radio", { name: /Submitted for Approval/i })
      .click();
    await expect(page.getByRole("link", { name: loopTitle })).toBeVisible();

    // Worker clicks Sign Out from /worker -> immediately redirects to /
    await page.getByRole("button", { name: /Sign Out/i }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Public Issue Tracking Dashboard" }),
    ).toBeVisible();

    // 3. Authority logs in -> /admin -> opens dedicated /admin/review/[id]
    await page.getByRole("button", { name: "Authority" }).first().click();
    await page
      .getByRole("button", { name: /Evaluator \/ Demo Authority Access/i })
      .click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 });

    // Compact top-right stat strip & Pending Verification banner
    await expect(
      page.getByRole("region", { name: "Operational queue summary" }),
    ).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Pending approval notifications" }),
    ).toBeVisible();

    // Click Review Completion -> on the Chennai task row
    const targetRow = page.getByRole("row", { name: loopTitle });
    await targetRow
      .getByRole("link", { name: /Review Completion/i })
      .click();

    // Dedicated Authority Completion Review page
    await expect(page).toHaveURL(new RegExp(`/admin/review/${issueId}$`), {
      timeout: 10_000,
    });
    await expect(
      page.getByText("Gemini AI Verification Report"),
    ).toBeVisible();
    await expect(page.getByText("After — Field Worker Proof")).toBeVisible();

    await page
      .getByRole("button", { name: /Approve & Mark Resolved/i })
      .click();

    // Redirects cleanly to /admin with confirmation banner & full active queue (NOT empty filter state)
    await expect(page).toHaveURL(/\/admin\?updated=.*&decision=approved/, {
      timeout: 15_000,
    });
    await expect(
      page.getByText(/Completion approved for #CR-2026-/i),
    ).toBeVisible();
    await expect(
      page.getByText("No issues match your current queue filters."),
    ).toHaveCount(0);

    // Authority clicks Sign Out from /admin -> redirects cleanly to /
    await page.getByRole("button", { name: /Sign Out/i }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });

    // 4. Public detail page shows all 4 completed lifecycle stages + Before & After Proof
    await page.goto(issuePath);
    const stages = page
      .getByRole("list", { name: "Municipal lifecycle stages" })
      .getByRole("listitem");
    await expect(stages).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(stages.nth(i)).toHaveAttribute("data-state", "completed");
    }
    await expect(
      page.getByText(/Before & After Resolution Proof/i),
    ).toBeVisible();
  });
});
