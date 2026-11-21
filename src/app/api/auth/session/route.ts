import { NextResponse } from "next/server";
import { isDemoAdminEnabled, verifyRequestAuth } from "@/lib/security/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/session — Resolves the caller's verified 3-tier role ("citizen" | "worker" | "authority" | null)
 * from either a Firebase ID token (`Authorization: Bearer <token>`) or signed Demo session cookie.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const demoEnabled = isDemoAdminEnabled();
  const result = await verifyRequestAuth(request);

  if (!result.authenticated) {
    return NextResponse.json(
      {
        authenticated: false,
        authorized: false,
        role: null,
        actor: "Unauthenticated",
        displayName: "Visitor",
        email: null,
        uid: null,
        isDemo: false,
        demoEnabled,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      authorized: result.authorized,
      role: result.role,
      actor: result.actor,
      displayName: result.displayName,
      email: result.email,
      uid: result.uid,
      isDemo: result.isDemo,
      demoEnabled,
    },
    { status: 200 },
  );
}
