import { NextResponse } from "next/server";
import { toggleIssueUpvote } from "@/lib/firebase/issuesRepository";
import { verifyRequestAuth } from "@/lib/security/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const UPVOTE_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000,
  maxRequests: 30,
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/issues/[id]/upvote — Requires authenticated user and toggles
 * their unique upvote (`upvotedBy`) on the issue (1 upvote per user).
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json(
      { error: "Please sign in to upvote civic issues." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request.headers);
  const rateCheck = checkRateLimit(
    `upvote:${auth.uid}:${ip}`,
    UPVOTE_RATE_LIMIT,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded for upvotes.",
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      },
    );
  }

  try {
    const { id } = await context.params;
    const result = await toggleIssueUpvote(id, auth.uid);
    if (!result) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }
    return NextResponse.json(
      {
        id: result.issue.id,
        upvotes: result.issue.upvotes,
        upvoted: result.upvoted,
        upvotedBy: result.issue.upvotedBy,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/issues/[id]/upvote] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to toggle community upvote." },
      { status: 500 },
    );
  }
}
