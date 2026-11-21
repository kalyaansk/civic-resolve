import { NextResponse } from "next/server";
import { analyzeCivicIssue } from "@/lib/ai/gemini";
import { validateImageBytes } from "@/lib/security/imageValidation";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { triagePreviewSchema } from "@/lib/validation/issueSchemas";

export const dynamic = "force-dynamic";

const TRIAGE_PREVIEW_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20,
};

/**
 * POST /api/triage-preview — Rate-limited live Gemini AI triage preview endpoint
 * powering the /report page's sticky Gemini AI Triage panel.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request.headers);
  const rateCheck = checkRateLimit(
    `triage-preview:${ip}`,
    TRIAGE_PREVIEW_RATE_LIMIT,
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "Too many AI triage preview requests. Please pause briefly.",
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      },
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = triagePreviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid triage preview input.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    let safeBase64: string | null = null;
    let safeMime: "image/jpeg" | "image/png" | "image/webp" | null = null;

    if (parsed.data.imageBase64 && parsed.data.imageMimeType) {
      const rawBytes = Uint8Array.from(
        Buffer.from(parsed.data.imageBase64, "base64"),
      );
      const imgValidation = validateImageBytes(
        rawBytes,
        parsed.data.imageMimeType,
      );
      if (!imgValidation.valid) {
        return NextResponse.json(
          { error: imgValidation.error },
          { status: 400 },
        );
      }
      safeBase64 = parsed.data.imageBase64;
      safeMime = imgValidation.mimeType;
    }

    const analysis = await analyzeCivicIssue({
      title: sanitizePlainText(parsed.data.title),
      description: sanitizePlainText(parsed.data.description),
      address: sanitizePlainText(parsed.data.address),
      categoryOverride: parsed.data.categoryOverride,
      imageBase64: safeBase64,
      imageMimeType: safeMime,
    });

    const rejected =
      analysis.isValidCivicIssue === false ||
      analysis.promptInjectionDetected === true;

    return NextResponse.json(
      { aiAnalysis: analysis, rejected },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/triage-preview] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to run AI triage preview." },
      { status: 500 },
    );
  }
}
