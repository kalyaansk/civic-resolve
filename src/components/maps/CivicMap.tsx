"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FallbackCivicMap } from "@/components/maps/FallbackCivicMap";
import { PriorityBadge, StatusBadge } from "@/components/ui/IssueBadges";
import { parseGoogleAddressComponents } from "@/lib/maps/geocoding";
import { loadGoogleMapsApi } from "@/lib/maps/googleMapsLoader";
import {
  buildGoogleMapsUrl,
  formatCoordinates,
} from "@/lib/utils/formatters";
import type { Issue } from "@/types/issue";

export interface SelectedLocationPayload {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
}

interface BaseMapProps {
  centerLat?: number;
  centerLng?: number;
  heightClassName?: string;
}

interface DashboardMapProps extends BaseMapProps {
  mode: "dashboard";
  issues: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string) => void;
}

interface PickerMapProps extends BaseMapProps {
  mode: "picker";
  addressInputRef?: React.RefObject<HTMLInputElement | null>;
  externalCoords?: { lat: number; lng: number; seq: number } | null;
  onLocationSelect: (payload: SelectedLocationPayload) => void;
}

interface PreviewMapProps extends BaseMapProps {
  mode: "preview";
  title: string;
  address: string;
}

export type CivicMapProps =
  | DashboardMapProps
  | PickerMapProps
  | PreviewMapProps;

async function reverseGeocodeCoords(
  gMaps: typeof google.maps,
  lat: number,
  lng: number,
): Promise<SelectedLocationPayload> {
  const roundedLat = Number(lat.toFixed(6));
  const roundedLng = Number(lng.toFixed(6));
  if (!gMaps.Geocoder) {
    return { lat: roundedLat, lng: roundedLng };
  }
  try {
    const geocoder = new gMaps.Geocoder();
    const response = await geocoder.geocode({
      location: { lat: roundedLat, lng: roundedLng },
    });
    const firstResult = response.results?.[0];
    if (!firstResult) {
      return { lat: roundedLat, lng: roundedLng };
    }
    const parsed = parseGoogleAddressComponents(
      firstResult.address_components,
      firstResult.formatted_address,
    );
    return { lat: roundedLat, lng: roundedLng, ...parsed };
  } catch {
    return { lat: roundedLat, lng: roundedLng };
  }
}

/**
 * Unified Google Maps JavaScript API + Places Autocomplete + Geocoder component
 * with an accessible interactive fallback street grid when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
 * is absent or blocked in test environments.
 */
export function CivicMap(props: CivicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const gMapsRef = useRef<typeof google.maps | null>(null);
  const pickerMarkerRef = useRef<google.maps.Marker | null>(null);
  const dashboardMarkersRef = useRef<Map<string, google.maps.Marker>>(
    new Map(),
  );
  const dashboardIssuesRef = useRef<Issue[]>([]);
  const selectIssueRef = useRef<(issueId: string) => void>(() => undefined);
  const onLocationSelectRef = useRef<
    ((payload: SelectedLocationPayload) => void) | null
  >(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [mapsUnavailable, setMapsUnavailable] = useState(false);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    props.mode === "dashboard" ? (props.issues[0]?.id ?? null) : null,
  );
  const controlledSelectedId =
    props.mode === "dashboard" ? props.selectedIssueId : undefined;
  const selectedIssueId =
    controlledSelectedId !== undefined
      ? controlledSelectedId
      : internalSelectedId;
  const onSelectIssueProp =
    props.mode === "dashboard" ? props.onSelectIssue : undefined;

  useEffect(() => {
    selectIssueRef.current = (issueId: string) => {
      setInternalSelectedId(issueId);
      onSelectIssueProp?.(issueId);
    };
  }, [onSelectIssueProp]);

  const centerLat = props.centerLat ?? 11.0168;
  const centerLng = props.centerLng ?? 76.9558;
  const pickerOnLocationSelect =
    props.mode === "picker" ? props.onLocationSelect : null;

  useEffect(() => {
    onLocationSelectRef.current = pickerOnLocationSelect;
  }, [pickerOnLocationSelect]);

  useEffect(() => {
    let cancelled = false;
    const listeners: google.maps.MapsEventListener[] = [];
    const dashboardMarkers = dashboardMarkersRef.current;

    const setup = async () => {
      const gMaps = await loadGoogleMapsApi();
      if (cancelled) return;

      if (!gMaps || !mapContainerRef.current) {
        setMapsUnavailable(true);
        return;
      }

      gMapsRef.current = gMaps;
      const mapInstance = new gMaps.Map(mapContainerRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: props.mode === "dashboard" ? 6 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = mapInstance;

      if (props.mode === "preview") {
        new gMaps.Marker({
          position: { lat: centerLat, lng: centerLng },
          map: mapInstance,
          title: props.title,
        });
      }

      if (props.mode === "picker") {
        const pickerMarker = new gMaps.Marker({
          position: { lat: centerLat, lng: centerLng },
          map: mapInstance,
          draggable: true,
          title: "Drag pin to pinpoint incident location",
        });
        pickerMarkerRef.current = pickerMarker;

        listeners.push(
          pickerMarker.addListener("dragend", () => {
            const pos = pickerMarker.getPosition();
            if (!pos) return;
            void reverseGeocodeCoords(gMaps, pos.lat(), pos.lng()).then(
              (payload) => onLocationSelectRef.current?.(payload),
            );
          }),
          mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (!event.latLng) return;
            pickerMarker.setPosition(event.latLng);
            void reverseGeocodeCoords(
              gMaps,
              event.latLng.lat(),
              event.latLng.lng(),
            ).then((payload) => onLocationSelectRef.current?.(payload));
          }),
        );

        if (props.addressInputRef?.current && gMaps.places?.Autocomplete) {
          const autocomplete = new gMaps.places.Autocomplete(
            props.addressInputRef.current,
            {
              fields: [
                "formatted_address",
                "address_components",
                "geometry",
                "name",
              ],
            },
          );
          listeners.push(
            autocomplete.addListener("place_changed", () => {
              const place = autocomplete.getPlace();
              const loc = place.geometry?.location;
              const parsed = parseGoogleAddressComponents(
                place.address_components,
                place.formatted_address,
                place.name,
              );
              if (loc) {
                const lat = loc.lat();
                const lng = loc.lng();
                mapInstance.setCenter({ lat, lng });
                mapInstance.setZoom(16);
                pickerMarker.setPosition({ lat, lng });
                onLocationSelectRef.current?.({
                  lat: Number(lat.toFixed(6)),
                  lng: Number(lng.toFixed(6)),
                  ...parsed,
                });
              }
            }),
          );
        }
      }

      setMapsReady(true);
      setMapsUnavailable(false);
    };

    void setup();

    return () => {
      cancelled = true;
      listeners.forEach((listener) => listener.remove());
      dashboardMarkers.forEach((m) => m.setMap(null));
      dashboardMarkers.clear();
      pickerMarkerRef.current = null;
      mapInstanceRef.current = null;
    };
    // Intentionally initialize map once per mode mount; dynamic updates handled in dedicated effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode]);

  const dashboardIssues = props.mode === "dashboard" ? props.issues : null;
  useEffect(() => {
    if (
      props.mode !== "dashboard" ||
      !mapsReady ||
      !mapInstanceRef.current ||
      !gMapsRef.current ||
      !dashboardIssues
    ) {
      return;
    }

    const map = mapInstanceRef.current;
    const gMaps = gMapsRef.current;

    dashboardMarkersRef.current.forEach((marker) => marker.setMap(null));
    dashboardMarkersRef.current.clear();
    dashboardIssuesRef.current = dashboardIssues;

    if (dashboardIssues.length === 0) return;

    const bounds = new gMaps.LatLngBounds();
    dashboardIssues.forEach((issue) => {
      const position = { lat: issue.location.lat, lng: issue.location.lng };
      bounds.extend(position);
      const marker = new gMaps.Marker({
        position,
        map,
        title: `${issue.referenceCode}: ${issue.title}`,
      });
      marker.addListener("click", () => selectIssueRef.current(issue.id));
      dashboardMarkersRef.current.set(issue.id, marker);
    });

    if (dashboardIssues.length === 1) {
      const only = dashboardIssues[0]!;
      map.setCenter({ lat: only.location.lat, lng: only.location.lng });
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, 48);
    }
  }, [props.mode, mapsReady, dashboardIssues]);

  useEffect(() => {
    if (props.mode !== "dashboard" || !mapsReady || !gMapsRef.current) return;
    const gMaps = gMapsRef.current;
    dashboardMarkersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedIssueId;
      marker.setIcon({
        path: gMaps.SymbolPath.CIRCLE,
        scale: isSelected ? 12 : 8,
        fillColor: isSelected ? "#1B365D" : "#0F766E",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: isSelected ? 3 : 2,
      });
      marker.setZIndex(isSelected ? 1000 : 1);
    });

    const map = mapInstanceRef.current;
    const selected = dashboardIssuesRef.current.find(
      (item) => item.id === selectedIssueId,
    );
    if (map && selected) {
      const position = {
        lat: selected.location.lat,
        lng: selected.location.lng,
      };
      if (!map.getBounds()?.contains(position)) {
        map.panTo(position);
      }
    }
  }, [props.mode, mapsReady, dashboardIssues, selectedIssueId]);

  const externalCoords =
    props.mode === "picker" ? props.externalCoords : undefined;
  useEffect(() => {
    if (
      props.mode !== "picker" ||
      !externalCoords ||
      !mapsReady ||
      !mapInstanceRef.current ||
      !gMapsRef.current ||
      !pickerMarkerRef.current
    ) {
      return;
    }

    const { lat, lng } = externalCoords;
    mapInstanceRef.current.setCenter({ lat, lng });
    mapInstanceRef.current.setZoom(16);
    pickerMarkerRef.current.setPosition({ lat, lng });

    void reverseGeocodeCoords(gMapsRef.current, lat, lng).then((payload) => {
      onLocationSelectRef.current?.(payload);
    });
  }, [props.mode, mapsReady, externalCoords]);

  const heightClass =
    props.heightClassName ??
    (props.mode === "dashboard" ? "h-[440px]" : "h-64");

  const activeDashboardIssue =
    props.mode === "dashboard"
      ? (props.issues.find((item) => item.id === selectedIssueId) ??
        (controlledSelectedId === undefined ? props.issues[0] : undefined) ??
        null)
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
      <div className={`relative w-full ${heightClass}`}>
        <div
          ref={mapContainerRef}
          role="region"
          aria-hidden={!mapsReady}
          className={mapsReady ? "h-full w-full" : "hidden"}
          aria-label={
            props.mode === "picker"
              ? "Interactive incident location map"
              : "Civic issues geographic map"
          }
        />

        {(!mapsReady || mapsUnavailable) && (
          <FallbackCivicMap
            mode={props.mode}
            centerLat={centerLat}
            centerLng={centerLng}
            issues={props.mode === "dashboard" ? props.issues : undefined}
            activeDashboardIssue={activeDashboardIssue}
            address={props.mode === "preview" ? props.address : undefined}
            onSelectIssue={(id) => selectIssueRef.current(id)}
            onPickCoords={
              props.mode === "picker" ? props.onLocationSelect : undefined
            }
          />
        )}
      </div>

      {props.mode === "dashboard" && activeDashboardIssue && (
        <div className="flex flex-col gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#1B365D]">
                #{activeDashboardIssue.referenceCode}
              </span>
              <StatusBadge status={activeDashboardIssue.status} />
              <PriorityBadge priority={activeDashboardIssue.priority} />
            </div>
            <p className="truncate text-sm font-bold text-[#0F172A]">
              {activeDashboardIssue.title}
            </p>
            <p className="text-xs text-[#475569]">
              {activeDashboardIssue.location.address},{" "}
              {activeDashboardIssue.city}, {activeDashboardIssue.state} •{" "}
              {activeDashboardIssue.department}
            </p>
          </div>
          <Link
            href={`/issues/${activeDashboardIssue.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1B365D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002046]"
          >
            View Issue Details
          </Link>
        </div>
      )}

      {props.mode === "preview" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs">
          <span className="font-medium text-[#475569]">
            {props.address} ({formatCoordinates(centerLat, centerLng)})
          </span>
          <a
            href={buildGoogleMapsUrl(centerLat, centerLng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#0369A1] hover:underline"
          >
            Open in Google Maps
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}
