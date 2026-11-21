"use client";

import { MapPin } from "lucide-react";
import { formatCoordinates } from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

function clampCoord(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

interface FallbackCivicMapProps {
  mode: "dashboard" | "picker" | "preview";
  centerLat: number;
  centerLng: number;
  issues?: Issue[];
  activeDashboardIssue?: Issue | null;
  address?: string;
  onSelectIssue?: (issueId: string) => void;
  onPickCoords?: (coords: { lat: number; lng: number }) => void;
}

/**
 * Accessible interactive fallback street grid rendered when Google Maps API
 * is unavailable or blocked in headless test environments.
 */
export function FallbackCivicMap({
  mode,
  centerLat,
  centerLng,
  issues = [],
  activeDashboardIssue = null,
  address = "",
  onSelectIssue,
  onPickCoords,
}: FallbackCivicMapProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#EFF6FF]"
      role="region"
      aria-label={
        mode === "picker"
          ? "Interactive fallback street grid location picker"
          : "Civic street grid map preview"
      }
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect width="800" height="400" fill="#F1F5F9" />
        <rect x="40" y="30" width="170" height="110" rx="8" fill="#E2E8F0" />
        <rect x="250" y="30" width="220" height="110" rx="8" fill="#DCFCE7" />
        <rect x="510" y="30" width="240" height="110" rx="8" fill="#E2E8F0" />
        <rect x="40" y="180" width="170" height="160" rx="8" fill="#E2E8F0" />
        <rect x="250" y="180" width="220" height="160" rx="8" fill="#E2E8F0" />
        <rect x="510" y="180" width="240" height="160" rx="8" fill="#DBEAFE" />
        <path
          d="M0 160 H800 M0 355 H800 M230 0 V400 M490 0 V400"
          stroke="#FFFFFF"
          strokeWidth="16"
        />
        <path
          d="M0 160 H800 M230 0 V400 M490 0 V400"
          stroke="#CBD5E1"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
      </svg>

      {mode === "dashboard" && (
        <div className="relative z-10 h-full w-full">
          {issues.map((issue, idx) => {
            const leftPct = clampCoord(
              18 + ((idx * 19 + Math.abs(issue.location.lng * 100)) % 68),
              12,
              88,
            );
            const topPct = clampCoord(
              18 + ((idx * 23 + Math.abs(issue.location.lat * 100)) % 60),
              16,
              76,
            );
            const isSelected = activeDashboardIssue?.id === issue.id;
            return (
              <button
                key={issue.id}
                type="button"
                onClick={() => onSelectIssue?.(issue.id)}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                aria-label={`Select issue ${issue.referenceCode}: ${issue.title}`}
                aria-pressed={isSelected}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2.5 py-1 text-xs font-bold shadow-md transition-transform ${
                  isSelected
                    ? "z-20 scale-110 border-white bg-[#1B365D] text-white"
                    : "border-white bg-[#0F766E] text-white hover:scale-105"
                }`}
              >
                {issue.urgencyScore}
              </button>
            );
          })}
        </div>
      )}

      {mode === "picker" && (
        <button
          type="button"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const relX = (event.clientX - rect.left) / rect.width - 0.5;
            const relY = (event.clientY - rect.top) / rect.height - 0.5;
            onPickCoords?.({
              lat: Number((centerLat - relY * 0.012).toFixed(4)),
              lng: Number((centerLng + relX * 0.016).toFixed(4)),
            });
          }}
          aria-label="Click anywhere on the street map to move the incident pin"
          className="relative z-10 flex h-full w-full cursor-crosshair items-center justify-center focus:outline-none"
        >
          <span className="flex flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#1B365D] text-white shadow-lg">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-1.5 rounded-full border border-[#CBD5E1] bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-[#0F172A] shadow-sm">
              Click map to adjust pin
            </span>
          </span>
        </button>
      )}

      {mode === "preview" && (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#1B365D] text-white shadow-lg">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="mt-2 rounded-lg border border-[#CBD5E1] bg-white/95 px-3 py-1 text-xs font-semibold text-[#0F172A] shadow-sm">
              {address}
            </span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-[#CBD5E1] bg-white/95 px-3 py-1 font-mono text-[11px] font-semibold text-[#0F172A] shadow-sm">
        {formatCoordinates(centerLat, centerLng)}
      </div>
    </div>
  );
}
