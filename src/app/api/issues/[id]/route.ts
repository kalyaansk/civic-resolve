import { NextResponse } from "next/server";
import {
  getIssueById,
  updateIssueRecord,
} from "@/lib/firebase/issuesRepository";
import { verifyAdminRequest } from "@/lib/security/auth";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { updateIssueSchema } from "@/lib/validation/issueSchemas";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/issues/[id] — Retrieves full detail and timeline for a civic issue.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const issue = await getIssueById(id);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }
    return NextResponse.json({ issue }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/issues/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve issue details." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/issues/[id] — Admin-protected endpoint for updating issue status,
 * department assignment, priority, and publishing citizen resolution notes.
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const authResult = await verifyAdminRequest(request);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: "Authentication required to update municipal issues." },
      { status: 401 },
    );
  }
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: "Forbidden. Admin privileges are required." },
      { status: 403 },
    );
  }

  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateIssueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid update payload.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const updated = await updateIssueRecord(id, {
      status: parsed.data.status,
      priority: parsed.data.priority,
      department: parsed.data.department,
      resolutionNote:
        parsed.data.resolutionNote !== undefined
          ? sanitizePlainText(parsed.data.resolutionNote)
          : undefined,
      reviewDecision: parsed.data.reviewDecision,
      updatedBy: authResult.actor,
    });

    if (!updated) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    return NextResponse.json({ issue: updated }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /api/issues/[id]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to update issue." },
      { status: 500 },
    );
  }
}
