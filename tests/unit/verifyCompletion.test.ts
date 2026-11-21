import { afterEach, describe, expect, it } from "vitest";
import {
  fetchSafeBeforePhotoPart,
  parseGeminiCompletionVerification,
  runFallbackCompletionVerification,
  verifyIssueCompletion,
} from "@/lib/ai/verifyCompletion";

describe("Gemini AI completion verification parser, SSRF guard & fallback", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("parses valid Gemini verification JSON wrapped in markdown code fences", () => {
    const raw = [
      "```json",
      JSON.stringify({
        verified: true,
        verdict: "Verified Fixed",
        confidence: 94.6,
        summary:
          "After-repair photo confirms hot-mix bitumen patch sits flush with surrounding carriageway and warning cones have been cleared.",
        recommendedAction: "Approve Resolution",
      }),
      "```",
    ].join("\n");

    const parsed = parseGeminiCompletionVerification(
      raw,
      "gemini-3.5-flash-lite",
      "2026-11-21T10:00:00.000Z",
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.verified).toBe(true);
    expect(parsed?.verdict).toBe("Verified Fixed");
    expect(parsed?.confidence).toBe(95);
    expect(parsed?.recommendedAction).toBe("Approve Resolution");
    expect(parsed?.source).toBe("gemini");
    expect(parsed?.analyzedAt).toBe("2026-11-21T10:00:00.000Z");
  });

  it("returns null on malformed JSON or invalid enum fields", () => {
    expect(
      parseGeminiCompletionVerification("not json", "gemini-3.5-flash-lite"),
    ).toBeNull();
    expect(
      parseGeminiCompletionVerification(
        JSON.stringify({ verified: true, verdict: "Awesome" }),
        "gemini-3.5-flash-lite",
      ),
    ).toBeNull();
  });

  it("evaluates deterministic fallback verification accurately", () => {
    const ok = runFallbackCompletionVerification({
      issueTitle: "Deep pothole near RS Puram",
      completionNote:
        "Filled crater with compacted hot-mix bitumen and rolled flush.",
      hasBeforePhoto: true,
      hasAfterPhoto: true,
    });
    expect(ok.verified).toBe(true);
    expect(ok.verdict).toBe("Verified Fixed");
    expect(ok.recommendedAction).toBe("Approve Resolution");
    expect(ok.source).toBe("fallback");

    const partial = runFallbackCompletionVerification({
      issueTitle: "Deep pothole near RS Puram",
      completionNote: "Temporary gravel fill placed; final paving pending.",
      hasBeforePhoto: false,
      hasAfterPhoto: true,
    });
    expect(partial.verified).toBe(false);
    expect(partial.verdict).toBe("Partially Fixed");
    expect(partial.recommendedAction).toBe("Request Rework");
  });

  it("blocks SVG paths and untrusted SSRF hosts in fetchSafeBeforePhotoPart", async () => {
    expect(
      await fetchSafeBeforePhotoPart("/images/issues/pothole.svg"),
    ).toBeNull();
    expect(
      await fetchSafeBeforePhotoPart("http://169.254.169.254/latest/meta-data"),
    ).toBeNull();
    expect(
      await fetchSafeBeforePhotoPart("https://evil.example.com/photo.jpg"),
    ).toBeNull();

    const dataPart = await fetchSafeBeforePhotoPart(
      "data:image/png;base64,iVBORw0KGgo=",
    );
    expect(dataPart?.mimeType).toBe("image/png");
  });

  it("falls back cleanly in verifyIssueCompletion when GEMINI_API_KEY is absent", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await verifyIssueCompletion({
      issueTitle: "Broken streetlight pole #14",
      issueDescription: "Streetlight dark near park entrance.",
      beforePhotoUrl: "/images/issues/streetlight.svg",
      afterImageBase64: "iVBORw0KGgo=",
      afterImageMimeType: "image/png",
      completionNote:
        "Replaced LED fixture driver and verified illumination at feeder pillar.",
    });

    expect(res.source).toBe("fallback");
    expect(res.verified).toBe(true);
    expect(res.verdict).toBe("Verified Fixed");
    expect(res.recommendedAction).toBe("Approve Resolution");
  });
});
