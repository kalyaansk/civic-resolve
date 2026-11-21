import { NextResponse } from "next/server";
import {
  createDemoWorkerToken,
  DEMO_ADMIN_COOKIE_NAME,
  DEMO_CITIZEN_COOKIE_NAME,
  DEMO_WORKER_COOKIE_NAME,
  extractCookie,
  isDemoAdminEnabled,
  verifyDemoWorkerToken,
} from "@/lib/security/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/demo-worker — Returns current Demo Field Worker session state.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const demoEnabled = isDemoAdminEnabled();
  const cookieToken = extractCookie(
    request.headers.get("cookie"),
    DEMO_WORKER_COOKIE_NAME,
  );
  const verified = verifyDemoWorkerToken(cookieToken);

  if (!verified?.valid) {
    return NextResponse.json(
      { authenticated: false, demoEnabled },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      demoEnabled,
      user: {
        uid: verified.uid,
        name: verified.name,
        email: verified.email,
        role: "worker",
        isDemo: true,
      },
    },
    { status: 200 },
  );
}

/**
 * POST /api/auth/demo-worker — Signs in as Demo Field Worker (when demo mode is enabled)
 * via an HMAC-signed HttpOnly session cookie, clearing Demo Citizen & Authority cookies.
 */
export async function POST(): Promise<NextResponse> {
  if (!isDemoAdminEnabled()) {
    return NextResponse.json(
      { error: "Demo Field Worker mode is disabled in this environment." },
      { status: 403 },
    );
  }

  const token = createDemoWorkerToken();
  const response = NextResponse.json(
    {
      authenticated: true,
      user: {
        uid: "demo-worker",
        name: "R. Selvam (Demo Field Worker)",
        email: "worker.demo@civicresolve.gov",
        role: "worker",
        isDemo: true,
      },
    },
    { status: 200 },
  );

  response.cookies.set(DEMO_WORKER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  for (const other of [DEMO_ADMIN_COOKIE_NAME, DEMO_CITIZEN_COOKIE_NAME]) {
    response.cookies.set(other, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

/**
 * DELETE /api/auth/demo-worker — Signs out of the Demo Field Worker session.
 */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json(
    { authenticated: false },
    { status: 200 },
  );
  response.cookies.set(DEMO_WORKER_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
