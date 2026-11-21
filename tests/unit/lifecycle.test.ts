import { describe, expect, it } from "vitest";
import { SEED_ISSUES } from "@/lib/data/seedIssues";
import { buildGoogleMapsUrl, buildLifecycleStages } from "@/lib/utils";
import type { IssueStatus } from "@/types/issue";

describe("buildLifecycleStages (4-stage municipal lifecycle)", () => {
  const entry = (status: IssueStatus) => ({
    status,
    timestamp: "2026-04-01T10:00:00.000Z",
    note: `${status} note`,
    updatedBy: "tester",
  });

  it("always returns Reported -> In Progress -> Pending Verification -> Resolved in order", () => {
    for (const issue of SEED_ISSUES) {
      expect(buildLifecycleStages(issue).map((s) => s.status)).toEqual([
        "Reported",
        "In Progress",
        "Pending Verification",
        "Resolved",
      ]);
    }
  });

  it("marks a newly reported issue as current/pending/pending/pending", () => {
    const stages = buildLifecycleStages({
      status: "Reported",
      statusHistory: [entry("Reported")],
    });
    expect(stages.map((s) => s.state)).toEqual([
      "current",
      "pending",
      "pending",
      "pending",
    ]);
    expect(stages[0]!.entries).toHaveLength(1);
    expect(stages[1]!.entries).toHaveLength(0);
  });

  it("marks an in-progress issue as completed/current/pending/pending", () => {
    const stages = buildLifecycleStages({
      status: "In Progress",
      statusHistory: [entry("Reported"), entry("In Progress")],
    });
    expect(stages.map((s) => s.state)).toEqual([
      "completed",
      "current",
      "pending",
      "pending",
    ]);
  });

  it("marks a pending-verification issue as completed/completed/current/pending", () => {
    const stages = buildLifecycleStages({
      status: "Pending Verification",
      statusHistory: [
        entry("Reported"),
        entry("In Progress"),
        entry("Pending Verification"),
      ],
    });
    expect(stages.map((s) => s.state)).toEqual([
      "completed",
      "completed",
      "current",
      "pending",
    ]);
  });

  it("treats Resolved as a completed terminal stage across all 4 steps", () => {
    const stages = buildLifecycleStages({
      status: "Resolved",
      statusHistory: [
        entry("Reported"),
        entry("In Progress"),
        entry("Pending Verification"),
        entry("Resolved"),
      ],
    });
    expect(stages.map((s) => s.state)).toEqual([
      "completed",
      "completed",
      "completed",
      "completed",
    ]);
  });

  it("keeps multiple entries logged under the same stage, oldest first", () => {
    const stages = buildLifecycleStages({
      status: "In Progress",
      statusHistory: [
        entry("Reported"),
        entry("In Progress"),
        { ...entry("In Progress"), note: "Second update" },
      ],
    });
    expect(stages[1]!.entries.map((e) => e.note)).toEqual([
      "In Progress note",
      "Second update",
    ]);
  });
});

describe("buildGoogleMapsUrl", () => {
  it("builds an encoded Google Maps search link", () => {
    expect(buildGoogleMapsUrl(11.0168, 76.9558)).toBe(
      "https://www.google.com/maps/search/?api=1&query=11.0168%2C76.9558",
    );
  });
});
