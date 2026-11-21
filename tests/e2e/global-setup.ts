/**
 * Warms the Next.js dev server's on-demand route compilation before the parallel E2E
 * workers start, so the first-compile Fast Refresh reload cannot interrupt a test mid-flow.
 */
export default async function globalSetup(): Promise<void> {
  const base = "http://localhost:3000";
  const routes = [
    "/",
    "/report",
    "/my-issues",
    "/worker",
    "/worker/tasks/cr-2026-0421",
    "/admin",
    "/admin/review/cr-2026-0412",
    "/issues/cr-2026-0421",
    "/api/auth/session",
  ];
  for (const route of routes) {
    try {
      await fetch(`${base}${route}`);
    } catch {
      // Best-effort warm-up only; individual tests surface real failures.
    }
  }
  for (const apiRoute of [
    "/api/issues",
    "/api/issues/cr-2026-0421/worker-action",
    "/api/issues/cr-2026-0421",
  ]) {
    try {
      await fetch(`${base}${apiRoute}`, { method: "POST" });
    } catch {
      // Returns 401/405 immediately after compiling the route bundle.
    }
  }
}
