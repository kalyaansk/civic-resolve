import { afterEach, describe, expect, it } from "vitest";
import { runDeterministicFallbackTriage } from "@/lib/ai/fallback";
import { analyzeCivicIssue, parseGeminiTriageResponse } from "@/lib/ai/gemini";

describe("Gemini AI triage parser & deterministic fallback", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("parses valid Gemini JSON output wrapped in markdown code fences", () => {
    const raw = [
      "```json",
      JSON.stringify({
        category: "Traffic & Signals",
        confidence: 97.4,
        priority: "Critical",
        urgencyScore: 95,
        recommendedDepartment: "Transportation & Traffic Engineering",
        estimatedImpact: "High risk of intersection collision during peak commute.",
        reasoning: "Complete four-way signal failure near school zone.",
        imageAltText: "Dark overhead traffic signal mast arm at intersection.",
      }),
      "```",
    ].join("\n");

    const parsed = parseGeminiTriageResponse(raw, "gemini-3.5-flash-lite");
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("gemini");
    expect(parsed?.urgencyScore).toBe(95);
    expect(parsed?.confidence).toBe(97);
    expect(parsed?.priority).toBe("Critical");
  });

  it("returns null on malformed JSON or invalid enum values", () => {
    expect(parseGeminiTriageResponse("not json", "gemini-3.5-flash-lite")).toBeNull();
    expect(
      parseGeminiTriageResponse(
        JSON.stringify({ category: "Unknown Category", urgencyScore: 50 }),
        "gemini-3.5-flash-lite",
      ),
    ).toBeNull();
  });

  it("respects citizen categoryOverride when provided", () => {
    const fallback = runDeterministicFallbackTriage({
      title: "Pothole next to street lamp",
      description: "Deep pavement crater near sidewalk.",
      categoryOverride: "Sidewalks & Accessibility",
      hasPhoto: true,
    });
    expect(fallback.category).toBe("Sidewalks & Accessibility");
    expect(fallback.source).toBe("fallback");
    expect(fallback.urgencyScore).toBeGreaterThanOrEqual(15);
    expect(fallback.urgencyScore).toBeLessThanOrEqual(98);
  });

  it("falls back seamlessly when GEMINI_API_KEY is absent", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await analyzeCivicIssue({
      title: "Live downed power line near elementary school",
      description:
        "Sparking wire resting on sidewalk outside school entrance gate.",
      address: "118 Oakwood Ave",
    });

    expect(result.source).toBe("fallback");
    expect(result.priority).toBe("Critical");
    expect(result.urgencyScore).toBeGreaterThanOrEqual(90);
  });
});
