import { NextResponse } from "next/server";
import {
  createDemoCitizenToken,
  DEMO_ADMIN_COOKIE_NAME,
  DEMO_CITIZEN_COOKIE_NAME,
  DEMO_WORKER_COOKIE_NAME,
  isDemoAdminEnabled,
} from "@/lib/security/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/demo-citizen — Signs in as Demo Citizen (when demo mode is enabled)
 * via an HMAC-signed HttpOnly cookie, clearing any Demo Authority cookie.
 */
export async function POST(): Promise<NextResponse> {
  if (!isDemoAdminEnabled()) {
    return NextResponse.json(
      { error: "Demo Citizen mode is disabled in this environment." },
      { status: 403 },
    );
  }

  const token = createDemoCitizenToken();
  const response = NextResponse.json(
    {
      authenticated: true,
      user: {
        uid: "demo-citizen",
        name: "Aarav K. (Demo Citizen)",
        email: "citizen.demo@civicresolve.gov",
        role: "citizen",
        isDemo: true,
      },
    },
    { status: 200 },
  );

  response.cookies.set(DEMO_CITIZEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  for (const other of [DEMO_ADMIN_COOKIE_NAME, DEMO_WORKER_COOKIE_NAME]) {
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
 * DELETE /api/auth/demo-citizen — Signs out of the Demo Citizen session.
 */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json(
    { authenticated: false },
    { status: 200 },
  );
  response.cookies.set(DEMO_CITIZEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
