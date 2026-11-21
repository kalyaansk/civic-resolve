import { describe, expect, it } from "vitest";
import { SEED_ISSUES } from "@/lib/data/seedIssues";
import { sanitizePublicIssue } from "@/lib/firebase/issuesRepository";
import { parseGoogleAddressComponents } from "@/lib/maps/geocoding";
import {
  detectImageMimeFromMagicBytes,
  MAX_IMAGE_BYTES,
  validateImageBytes,
} from "@/lib/security/imageValidation";
import { escapeCsvCell, sanitizePlainText } from "@/lib/security/sanitize";
import {
  formatCoordinates,
  formatIssuesAsCsv,
  formatIssuesAsJson,
} from "@/lib/utils";
import {
  completionVerificationResponseSchema,
  createIssueSchema,
  listIssuesQuerySchema,
  updateIssueSchema,
  workerCompletionNoteSchema,
  workerStartActionSchema,
} from "@/lib/validation/issueSchemas";

describe("Coordinate formatting & Google address component parsing", () => {
  it("formats positive/negative latitude and longitude with accurate N/S/E/W hemispheres", () => {
    expect(formatCoordinates(11.0168, 77.0678)).toBe("11.0168° N, 77.0678° E");
    expect(formatCoordinates(-33.8688, 151.2093)).toBe("33.8688° S, 151.2093° E");
    expect(formatCoordinates(40.7128, -74.006)).toBe("40.7128° N, 74.0060° W");
  });

  it("extracts street address, city, state, and district from Google Geocoder components", () => {
    const parsed = parseGoogleAddressComponents(
      [
        { long_name: "42", short_name: "42", types: ["street_number"] },
        { long_name: "Diwan Bahadur Road", short_name: "DB Rd", types: ["route"] },
        {
          long_name: "RS Puram",
          short_name: "RS Puram",
          types: ["sublocality_level_1", "sublocality"],
        },
        { long_name: "Coimbatore", short_name: "Coimbatore", types: ["locality"] },
        {
          long_name: "Tamil Nadu",
          short_name: "TN",
          types: ["administrative_area_level_1"],
        },
      ],
      "42 Diwan Bahadur Road, RS Puram, Coimbatore, Tamil Nadu 641002, India",
    );

    expect(parsed.address).toBe("42 Diwan Bahadur Road");
    expect(parsed.city).toBe("Coimbatore");
    expect(parsed.state).toBe("Tamil Nadu");
    expect(parsed.district).toBe("RS Puram");
  });
});

describe("Image magic-byte & size validation", () => {
  it("accepts valid JPEG, PNG, and WebP signatures within 5 MB", () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);

    expect(detectImageMimeFromMagicBytes(jpegBytes)).toBe("image/jpeg");
    expect(detectImageMimeFromMagicBytes(pngBytes)).toBe("image/png");
    expect(detectImageMimeFromMagicBytes(webpBytes)).toBe("image/webp");

    expect(validateImageBytes(jpegBytes, "image/jpeg").valid).toBe(true);
    expect(validateImageBytes(pngBytes, "image/png").valid).toBe(true);
    expect(validateImageBytes(webpBytes, "image/webp").valid).toBe(true);
  });

  it("rejects mismatched MIME types and spoofed text payloads", () => {
    const scriptBytes = new TextEncoder().encode("<script>alert(1)</script>");
    expect(validateImageBytes(scriptBytes, "image/png").valid).toBe(false);

    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(validateImageBytes(jpegBytes, "image/png").valid).toBe(false);
  });

  it("rejects files exceeding 5 MB", () => {
    const oversized = new Uint8Array(MAX_IMAGE_BYTES + 1);
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;
    const res = validateImageBytes(oversized, "image/jpeg");
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain("5 MB");
    }
  });
});

describe("Sanitization, Open Data Exports & Zod API schemas", () => {
  it("strips HTML tags and neutralizes CSV formula injection while exporting State & City", () => {
    expect(sanitizePlainText("<b>Pothole</b> on DB Rd\u0000!")).toBe(
      "Pothole on DB Rd!",
    );
    expect(escapeCsvCell("=CMD('calc')")).toBe("'=CMD('calc')");
    expect(escapeCsvCell("+123")).toBe("'+123");

    const csv = formatIssuesAsCsv(SEED_ISSUES.slice(0, 2));
    expect(csv).toContain("State,City,District");
    expect(csv).toContain("Tamil Nadu,Coimbatore");

    const json = JSON.parse(formatIssuesAsJson(SEED_ISSUES.slice(0, 1))) as {
      issues: Array<{ state: string; city: string }>;
    };
    expect(json.issues[0]?.state).toBe("Tamil Nadu");
    expect(json.issues[0]?.city).toBe("Coimbatore");
  });

  it("requires city & state in createIssueSchema and parses regional query defaults", () => {
    const valid = createIssueSchema.safeParse({
      title: "Deep pothole near RS Puram bus stop",
      description:
        "Large water-filled pothole adjacent to the municipal bus stop lane.",
      location: {
        address: "DB Road, RS Puram",
        city: "Coimbatore",
        state: "Tamil Nadu",
        district: "RS Puram",
        lat: 11.0081,
        lng: 76.9516,
      },
    });
    expect(valid.success).toBe(true);

    const missingRegion = createIssueSchema.safeParse({
      title: "Deep pothole near RS Puram bus stop",
      description: "Large water-filled pothole adjacent to bus stop.",
      location: { address: "DB Road", city: "", state: "", lat: 11, lng: 77 },
    });
    expect(missingRegion.success).toBe(false);

    expect(updateIssueSchema.safeParse({}).success).toBe(false);
    expect(updateIssueSchema.safeParse({ status: "Resolved" }).success).toBe(
      true,
    );
    expect(
      updateIssueSchema.safeParse({ status: "Pending Verification" }).success,
    ).toBe(true);
    expect(
      updateIssueSchema.safeParse({ reviewDecision: "approve" }).success,
    ).toBe(true);
    expect(
      updateIssueSchema.safeParse({ reviewDecision: "reject" }).success,
    ).toBe(true);

    expect(
      workerStartActionSchema.safeParse({ action: "start" }).success,
    ).toBe(true);
    expect(workerCompletionNoteSchema.safeParse("Too short").success).toBe(
      false,
    );
    expect(
      workerCompletionNoteSchema.safeParse(
        "Patched pothole with compacted hot-mix bitumen and sealed edges.",
      ).success,
    ).toBe(true);
    expect(
      completionVerificationResponseSchema.safeParse({
        verified: true,
        verdict: "Verified Fixed",
        confidence: 92,
        summary: "Clear hot-mix asphalt repair flush with road surface.",
        recommendedAction: "Approve Resolution",
      }).success,
    ).toBe(true);

    const query = listIssuesQuerySchema.parse({});
    expect(query.limit).toBe(20);
    expect(query.state).toBe("All");
    expect(query.city).toBe("All");
    expect(query.mine).toBe(false);
  });

  it("normalizes legacy or unknown status/priority values safely in sanitizePublicIssue", () => {
    const normalized = sanitizePublicIssue({
      ...SEED_ISSUES[0]!,
      status: "Legacy Open" as never,
      priority: "Urgent" as never,
      statusHistory: [
        {
          status: "Unknown Stage" as never,
          timestamp: "2026-11-21T08:00:00.000Z",
          note: "Legacy record",
          updatedBy: "System",
        },
      ],
    });
    expect(normalized.status).toBe("Reported");
    expect(normalized.priority).toBe("Medium");
    expect(normalized.statusHistory[0]?.status).toBe("Reported");
  });
});
