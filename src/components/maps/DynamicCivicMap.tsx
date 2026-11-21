"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { CivicMapProps } from "./CivicMap";

function CivicMapSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading interactive map"
      className="flex h-[320px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0369A1]">
        <MapPin className="h-5 w-5 animate-pulse" aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold text-[#475569]">
        Loading interactive civic map...
      </p>
    </div>
  );
}

/**
 * Lazily-loaded CivicMap wrapper (`ssr: false`) that keeps the Google Maps
 * client bundle out of the initial SSR / hydration chunk.
 */
export const DynamicCivicMap = dynamic<CivicMapProps>(
  () => import("./CivicMap").then((mod) => mod.CivicMap),
  {
    ssr: false,
    loading: () => <CivicMapSkeleton />,
  },
);

export type { CivicMapProps, SelectedLocationPayload } from "./CivicMap";
