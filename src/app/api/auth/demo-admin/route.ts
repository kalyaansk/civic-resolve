import { NextResponse } from "next/server";
import {
  createDemoAdminToken,
  DEMO_ADMIN_COOKIE_NAME,
  DEMO_CITIZEN_COOKIE_NAME,
  DEMO_WORKER_COOKIE_NAME,
  extractCookie,
  isDemoAdminEnabled,
  verifyDemoAdminToken,
} from "@/lib/security/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/demo-admin — Returns current Demo Authority session state.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const demoEnabled = isDemoAdminEnabled();
  const cookieToken = extractCookie(
    request.headers.get("cookie"),
    DEMO_ADMIN_COOKIE_NAME,
  );
  const verified = verifyDemoAdminToken(cookieToken);

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
        role: "authority",
        isDemo: true,
      },
    },
    { status: 200 },
  );
}

/**
 * POST /api/auth/demo-admin — Signs in as Demo Municipal Authority (when enabled)
 * via an HMAC-signed HttpOnly session cookie, clearing any Demo Citizen cookie.
 */
export async function POST(): Promise<NextResponse> {
  if (!isDemoAdminEnabled()) {
    return NextResponse.json(
      { error: "Demo Authority mode is disabled in this environment." },
      { status: 403 },
    );
  }

  const token = createDemoAdminToken();
  const response = NextResponse.json(
    {
      authenticated: true,
      user: {
        uid: "demo-admin",
        name: "M. Alvarez (Demo Authority)",
        email: "ops.lead@civicresolve.gov",
        role: "authority",
        isDemo: true,
      },
    },
    { status: 200 },
  );

  response.cookies.set(DEMO_ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  for (const other of [DEMO_CITIZEN_COOKIE_NAME, DEMO_WORKER_COOKIE_NAME]) {
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
 * DELETE /api/auth/demo-admin — Signs out of the Demo Authority session.
 */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json(
    { authenticated: false },
    { status: 200 },
  );
  response.cookies.set(DEMO_ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
