"use client";

import { Crosshair, Loader2, MapPin } from "lucide-react";
import type { RefObject } from "react";
import {
  DynamicCivicMap,
  type SelectedLocationPayload,
} from "@/components/maps/DynamicCivicMap";

interface LocationPickerSectionProps {
  addressInputRef: RefObject<HTMLInputElement | null>;
  address: string;
  onAddressChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  stateName: string;
  onStateChange: (value: string) => void;
  district: string;
  onDistrictChange: (value: string) => void;
  lat: number;
  lng: number;
  externalCoords: { lat: number; lng: number; seq: number } | null;
  locating: boolean;
  locationMessage: string | null;
  onUseMyLocation: () => void;
  onLocationSelect: (payload: SelectedLocationPayload) => void;
}

export function LocationPickerSection({
  addressInputRef,
  address,
  onAddressChange,
  city,
  onCityChange,
  stateName,
  onStateChange,
  district,
  onDistrictChange,
  lat,
  lng,
  externalCoords,
  locating,
  locationMessage,
  onUseMyLocation,
  onLocationSelect,
}: LocationPickerSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="issue-address"
          className="block text-sm font-semibold text-[#0F172A]"
        >
          Incident Location <span className="text-[#991B1B]">*</span>
        </label>
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF] disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Use My Location
        </button>
      </div>

      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0369A1]"
          aria-hidden="true"
        />
        <input
          ref={addressInputRef}
          id="issue-address"
          name="address"
          type="text"
          required
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Search street address or click map to auto-fill"
          className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-2.5 pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="issue-city"
            className="block text-xs font-semibold text-[#0F172A]"
          >
            City <span className="text-[#991B1B]">*</span>
          </label>
          <input
            id="issue-city"
            name="city"
            type="text"
            required
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="e.g., Coimbatore"
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="issue-state"
            className="block text-xs font-semibold text-[#0F172A]"
          >
            State <span className="text-[#991B1B]">*</span>
          </label>
          <input
            id="issue-state"
            name="state"
            type="text"
            required
            value={stateName}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="e.g., Tamil Nadu"
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="issue-district"
            className="block text-xs font-semibold text-[#0F172A]"
          >
            District / Locality
          </label>
          <input
            id="issue-district"
            name="district"
            type="text"
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            placeholder="e.g., RS Puram"
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
          />
        </div>
      </div>

      {locationMessage && (
        <p className="text-xs font-medium text-[#0F766E]">{locationMessage}</p>
      )}

      <DynamicCivicMap
        mode="picker"
        centerLat={lat}
        centerLng={lng}
        addressInputRef={addressInputRef}
        externalCoords={externalCoords}
        onLocationSelect={onLocationSelect}
      />
    </div>
  );
}
