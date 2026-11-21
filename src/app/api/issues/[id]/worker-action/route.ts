import { NextResponse } from "next/server";
import { verifyIssueCompletion } from "@/lib/ai/verifyCompletion";
import {
  getIssueById,
  startWorkerTask,
  submitWorkerCompletion,
  uploadIssuePhoto,
} from "@/lib/firebase/issuesRepository";
import { verifyRequestAuth } from "@/lib/security/auth";
import { validateUploadedPhoto } from "@/lib/security/imageValidation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import {
  workerCompletionNoteSchema,
  workerStartActionSchema,
} from "@/lib/validation/issueSchemas";

export const dynamic = "force-dynamic";

const WORKER_ACTION_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 30,
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/issues/[id]/worker-action — Strictly restricted to verified Field Workers (`role === "worker"`).
 * - JSON `{ action: "start", note? }`: transitions `Reported` -> `In Progress`.
 * - Multipart FormData (`afterPhoto` + `completionNote`): validates photo (<= 5 MB, JPEG/PNG/WebP magic bytes),
 *   runs Gemini AI before-vs-after verification, uploads to Firebase Storage, and moves status to `Pending Verification`.
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json(
      { error: "Authentication required for Field Worker actions." },
      { status: 401 },
    );
  }
  if (auth.role !== "worker") {
    return NextResponse.json(
      { error: "Forbidden. Field Worker privileges are required." },
      { status: 403 },
    );
  }

  const ip = getClientIp(request.headers);
  const rateCheck = checkRateLimit(
    `worker-action:${auth.uid}:${ip}`,
    WORKER_ACTION_RATE_LIMIT,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded for field worker submissions.",
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
    const existing = await getIssueById(id);
    if (!existing) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }
    if (existing.status !== "Reported" && existing.status !== "In Progress") {
      return NextResponse.json(
        {
          error: `Only Reported or In Progress issues can accept field work updates (current status: ${existing.status}).`,
        },
        { status: 409 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const photos = formData
        .getAll("afterPhoto")
        .filter((v): v is File => v instanceof File && v.size > 0);

      if (photos.length === 0) {
        return NextResponse.json(
          { error: "After-Repair Proof Photo is required (JPEG, PNG, or WebP, max 5 MB)." },
          { status: 400 },
        );
      }
      if (photos.length > 1) {
        return NextResponse.json(
          { error: "Only 1 after-repair proof photo can be uploaded." },
          { status: 400 },
        );
      }

      const imgResult = await validateUploadedPhoto(photos[0]!);
      if (!imgResult.valid) {
        return NextResponse.json({ error: imgResult.error }, { status: 400 });
      }

      const rawNote = formData.get("completionNote");
      const parsedNote = workerCompletionNoteSchema.safeParse(rawNote);
      if (!parsedNote.success) {
        return NextResponse.json(
          {
            error:
              parsedNote.error.issues[0]?.message ||
              "Completion summary must be between 10 and 1,000 characters.",
          },
          { status: 400 },
        );
      }
      const cleanNote = sanitizePlainText(parsedNote.data);

      const afterImageBase64 = Buffer.from(imgResult.bytes).toString("base64");
      const [completionVerification, afterPhotoUrl] = await Promise.all([
        verifyIssueCompletion({
          issueTitle: existing.title,
          issueDescription: existing.description,
          beforePhotoUrl: existing.photoUrl,
          afterImageBase64,
          afterImageMimeType: imgResult.mimeType,
          completionNote: cleanNote,
        }),
        uploadIssuePhoto(
          existing.id,
          imgResult.bytes,
          imgResult.mimeType,
          imgResult.extension,
          "after",
        ),
      ]);

      const updated = await submitWorkerCompletion(
        existing.id,
        {
          afterPhotoUrl,
          workerUid: auth.uid,
          workerName: auth.actor,
          workerNote: cleanNote,
          aiVerification: completionVerification,
        },
        existing,
      );

      if (!updated) {
        return NextResponse.json({ error: "Issue not found." }, { status: 404 });
      }

      return NextResponse.json(
        {
          issue: updated,
          completionVerification,
        },
        { status: 200 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const parsedStart = workerStartActionSchema.safeParse(body);
    if (!parsedStart.success) {
      return NextResponse.json(
        {
          error: "Invalid field worker action payload.",
          details: parsedStart.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const cleanNote = parsedStart.data.note
      ? sanitizePlainText(parsedStart.data.note)
      : undefined;
    const updated = await startWorkerTask(
      existing.id,
      auth.actor,
      cleanNote,
      existing,
    );

    if (!updated) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    return NextResponse.json({ issue: updated }, { status: 200 });
  } catch (error) {
    console.error(
      "[POST /api/issues/[id]/worker-action] Unexpected error:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to process field worker action." },
      { status: 500 },
    );
  }
}
