import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { analyzeCivicIssue } from "@/lib/ai/gemini";
import {
  createIssueRecord,
  listIssues,
  uploadIssuePhoto,
} from "@/lib/firebase/issuesRepository";
import {
  getSafePublicReporterName,
  verifyRequestAuth,
} from "@/lib/security/auth";
import { validateUploadedPhoto } from "@/lib/security/imageValidation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import {
  createIssueSchema,
  listIssuesQuerySchema,
} from "@/lib/validation/issueSchemas";

export const dynamic = "force-dynamic";

const CREATE_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 10,
};

/**
 * GET /api/issues — Lists paginated civic issues with regional (`state`/`city`),
 * ownership (`mine=true`), status, priority, and category filtering.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const rawParams = {
      search: url.searchParams.get("search") ?? undefined,
      state: url.searchParams.get("state") ?? undefined,
      city: url.searchParams.get("city") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      department: url.searchParams.get("department") ?? undefined,
      mine: url.searchParams.get("mine") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    };

    const parsed = listIssuesQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    let currentUserUid: string | null = null;
    if (parsed.data.mine) {
      const auth = await verifyRequestAuth(request);
      if (!auth.authenticated || !auth.uid) {
        return NextResponse.json(
          { error: "Authentication required to view your reported issues." },
          { status: 401 },
        );
      }
      currentUserUid = auth.uid;
    }

    const result = await listIssues(parsed.data, currentUserUid);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[GET /api/issues] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to load civic issues." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/issues — Strictly requires an authenticated Citizen account.
 * Rejects unauthenticated requests (401) and non-citizen roles such as Field Workers (403).
 * Validates complaint + optional photo (<= 5 MB), stamps `reporterUid` & `reporterName`
 * from the verified token, runs multimodal Gemini AI triage, uploads photo, and saves.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth.authenticated || !auth.uid) {
    return NextResponse.json(
      { error: "Please sign in as a Citizen before submitting a civic issue." },
      { status: 401 },
    );
  }
  if (auth.role !== "citizen") {
    return NextResponse.json(
      { error: "Forbidden. Only Citizen accounts can file civic issue reports." },
      { status: 403 },
    );
  }

  const ip = getClientIp(request.headers);
  const rateCheck = checkRateLimit(`create-issue:${ip}`, CREATE_RATE_LIMIT);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "Too many issue submissions. Please try again shortly.",
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let rawPayload: Record<string, unknown> = {};
    let photoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const entries = formData
        .getAll("photo")
        .filter((v) => v instanceof File && v.size > 0);
      if (entries.length > 1) {
        return NextResponse.json(
          { error: "Only 1 photo upload is allowed per issue report." },
          { status: 400 },
        );
      }
      if (entries[0] instanceof File) {
        photoFile = entries[0];
      }

      const categoryVal = formData.get("categoryOverride");
      rawPayload = {
        title: formData.get("title"),
        description: formData.get("description"),
        categoryOverride:
          typeof categoryVal === "string" && categoryVal.trim() !== ""
            ? categoryVal
            : null,
        location: {
          address: formData.get("address"),
          city: formData.get("city"),
          state: formData.get("state"),
          district: formData.get("district") || "",
          lat: formData.get("lat") ?? 11.0168,
          lng: formData.get("lng") ?? 76.9558,
        },
      };
    } else {
      const body: unknown = await request.json();
      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { error: "Invalid JSON request body." },
          { status: 400 },
        );
      }
      rawPayload = body as Record<string, unknown>;
    }

    const parsed = createIssueSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed. Please review your submission.",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const cleanTitle = sanitizePlainText(parsed.data.title);
    const cleanDescription = sanitizePlainText(parsed.data.description);
    const cleanAddress = sanitizePlainText(parsed.data.location.address);
    const cleanCity = sanitizePlainText(parsed.data.location.city);
    const cleanState = sanitizePlainText(parsed.data.location.state);
    const cleanDistrict = sanitizePlainText(parsed.data.location.district);

    let validatedImage: {
      bytes: Uint8Array;
      mimeType: "image/jpeg" | "image/png" | "image/webp";
      extension: "jpg" | "png" | "webp";
      base64: string;
    } | null = null;

    if (photoFile) {
      const imgResult = await validateUploadedPhoto(photoFile);
      if (!imgResult.valid) {
        return NextResponse.json({ error: imgResult.error }, { status: 400 });
      }
      validatedImage = {
        bytes: imgResult.bytes,
        mimeType: imgResult.mimeType,
        extension: imgResult.extension,
        base64: Buffer.from(imgResult.bytes).toString("base64"),
      };
    }

    const fullLocationLabel = [cleanAddress, cleanDistrict, cleanCity, cleanState]
      .filter(Boolean)
      .join(", ");

    const aiAnalysis = await analyzeCivicIssue({
      title: cleanTitle,
      description: cleanDescription,
      address: fullLocationLabel,
      categoryOverride: parsed.data.categoryOverride,
      imageBase64: validatedImage?.base64 ?? null,
      imageMimeType: validatedImage?.mimeType ?? null,
    });

    if (
      aiAnalysis.promptInjectionDetected === true ||
      aiAnalysis.isValidCivicIssue === false
    ) {
      return NextResponse.json(
        {
          error:
            aiAnalysis.rejectionReason ||
            "Off-topic or invalid civic report detected. Please describe a genuine municipal infrastructure or public safety issue.",
          rejected: true,
          aiAnalysis,
        },
        { status: 400 },
      );
    }

    const issueId = `cr-2026-${crypto.randomInt(1000, 9999)}`;
    let photoUrl: string | null = null;
    if (validatedImage) {
      photoUrl = await uploadIssuePhoto(
        issueId,
        validatedImage.bytes,
        validatedImage.mimeType,
        validatedImage.extension,
      );
    }

    const created = await createIssueRecord({
      id: issueId,
      title: cleanTitle,
      description: cleanDescription,
      location: {
        address: cleanAddress,
        city: cleanCity,
        state: cleanState,
        district: cleanDistrict || cleanCity,
        lat: parsed.data.location.lat,
        lng: parsed.data.location.lng,
      },
      photoUrl,
      reporterUid: auth.uid,
      reporterName: getSafePublicReporterName(auth.displayName, auth.email),
      aiAnalysis,
    });

    return NextResponse.json({ issue: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/issues] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to submit civic issue report." },
      { status: 500 },
    );
  }
}
