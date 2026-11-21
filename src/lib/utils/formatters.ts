import { escapeCsvCell } from "@/lib/security/sanitize";
import type { Issue } from "@/types/issue";

/**
 * Formats geographic coordinates with accurate hemisphere labels (N/S and E/W).
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Formats an ISO timestamp into a readable municipal date/time string.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formats an ISO timestamp into a compact relative age label (e.g., "2h ago").
 */
export function formatRelativeTime(
  iso: string,
  nowMs: number = Date.now(),
): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "Recently";
  const diffSeconds = Math.max(0, Math.floor((nowMs - target) / 1000));
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDateTime(iso);
}

/**
 * Checks whether an image source is a data URI, blob URL, or SVG asset
 * (which should skip Next.js raster optimization).
 */
export function isInlineOrSvgUrl(src: string): boolean {
  return (
    src.startsWith("data:") || src.startsWith("blob:") || src.endsWith(".svg")
  );
}

/**
 * Formats a complete street + district + city + state address cleanly.
 */
export function formatFullAddress(
  issue: Pick<Issue, "location" | "city" | "state">,
): string {
  return [
    issue.location.address,
    issue.location.district,
    issue.city,
    issue.state,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Builds a Google Maps deep link for a coordinate pair.
 */
export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lat},${lng}`,
  )}`;
}

/**
 * Serializes filtered civic issues as a safe RFC-4180 CSV dataset for Open Data downloads.
 */
export function formatIssuesAsCsv(issues: Issue[]): string {
  const headers = [
    "Reference ID",
    "Title",
    "Category",
    "Status",
    "Priority",
    "Urgency Score",
    "Department",
    "State",
    "City",
    "District",
    "Address",
    "Latitude",
    "Longitude",
    "Upvotes",
    "AI Source",
    "AI Confidence",
    "Created At",
    "Updated At",
    "Resolution Note",
  ];

  const rows = issues.map((issue) => [
    issue.referenceCode,
    issue.title,
    issue.category,
    issue.status,
    issue.priority,
    issue.urgencyScore,
    issue.department,
    issue.state || issue.location.state,
    issue.city || issue.location.city,
    issue.location.district,
    issue.location.address,
    issue.location.lat,
    issue.location.lng,
    issue.upvotes,
    issue.aiAnalysis.source,
    issue.aiAnalysis.confidence,
    issue.createdAt,
    issue.updatedAt,
    issue.resolutionNote ?? "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

/**
 * Serializes filtered civic issues as a formatted Open311-inspired JSON document.
 */
export function formatIssuesAsJson(issues: Issue[]): string {
  return JSON.stringify(
    {
      schema: "civicresolve-open-data-v2",
      exportedAt: new Date().toISOString(),
      count: issues.length,
      issues: issues.map((issue) => ({
        id: issue.id,
        referenceCode: issue.referenceCode,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        urgencyScore: issue.urgencyScore,
        department: issue.department,
        state: issue.state || issue.location.state,
        city: issue.city || issue.location.city,
        location: issue.location,
        upvotes: issue.upvotes,
        aiAnalysis: issue.aiAnalysis,
        statusHistory: issue.statusHistory,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolutionNote: issue.resolutionNote,
      })),
    },
    null,
    2,
  );
}

/**
 * Triggers a browser file download for generated CSV/JSON open-data exports.
 */
export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
