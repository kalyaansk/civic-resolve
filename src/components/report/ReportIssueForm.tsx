"use client";

import {
  Camera,
  Crosshair,
  Loader2,
  MapPin,
  Send,
  ShieldAlert,
  Trash2,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CivicMap,
  type SelectedLocationPayload,
} from "@/components/maps/CivicMap";
import { GeminiTriageCard } from "@/components/report/GeminiTriageCard";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
} from "@/lib/security/imageValidation";
import {
  ISSUE_CATEGORIES,
  type AIAnalysis,
  type IssueCategory,
} from "@/types/issue";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read image file."));
        return;
      }
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read photo."));
    reader.readAsDataURL(file);
  });
}

export function ReportIssueForm() {
  const router = useRouter();
  const { user, getAuthHeaders, openSignInDialog } = useAuth();
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [lat, setLat] = useState(11.0168);
  const [lng, setLng] = useState(76.9558);
  const [externalCoords, setExternalCoords] = useState<{
    lat: number;
    lng: number;
    seq: number;
  } | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<string>("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const handleMapLocationSelect = useCallback(
    (payload: SelectedLocationPayload) => {
      setLat(payload.lat);
      setLng(payload.lng);
      if (payload.address) setAddress(payload.address);
      if (payload.city) setCity(payload.city);
      if (payload.state) setStateName(payload.state);
      if (payload.district) setDistrict(payload.district);
      if (payload.address || payload.city) {
        setLocationMessage(
          `Location updated via map (${[payload.city, payload.state].filter(Boolean).join(", ")}).`,
        );
      }
    },
    [],
  );

  const runTriagePreview = useCallback(async () => {
    if (title.trim().length < 4 || description.trim().length < 10) {
      return;
    }

    setAnalyzing(true);
    try {
      let imageBase64: string | null = null;
      let imageMimeType: "image/jpeg" | "image/png" | "image/webp" | null = null;

      if (photoFile) {
        imageBase64 = await fileToBase64(photoFile);
        imageMimeType = photoFile.type as
          | "image/jpeg"
          | "image/png"
          | "image/webp";
      }

      const fullLocation = [address, district, city, stateName]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");

      const res = await fetch("/api/triage-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          address: fullLocation,
          categoryOverride:
            categoryOverride !== ""
              ? (categoryOverride as IssueCategory)
              : null,
          imageBase64,
          imageMimeType,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { aiAnalysis: AIAnalysis };
        setAnalysis(data.aiAnalysis);
      }
    } catch {
      // Keep current preview cleanly
    } finally {
      setAnalyzing(false);
    }
  }, [title, description, address, district, city, stateName, categoryOverride, photoFile]);

  // Debounced live AI preview only once citizen enters meaningful title & description
  useEffect(() => {
    if (title.trim().length < 6 || description.trim().length < 15) {
      return;
    }
    const timer = setTimeout(() => {
      void runTriagePreview();
    }, 650);
    return () => clearTimeout(timer);
  }, [title, description, categoryOverride, photoFile, runTriagePreview]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setPhotoError("Please select 1 photo only (max 5 MB).");
      return;
    }

    const file = files[0]!;
    if (
      !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)
    ) {
      setPhotoError("Unsupported file type. Upload a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoError("Photo exceeds the 5 MB limit. Please choose a smaller file.");
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUseMyLocation = () => {
    setLocationMessage(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationMessage(
        "Browser geolocation is unavailable. Enter your street address or click the map pin.",
      );
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(6));
        const nextLng = Number(pos.coords.longitude.toFixed(6));
        setLat(nextLat);
        setLng(nextLng);
        setExternalCoords((prev) => ({
          lat: nextLat,
          lng: nextLng,
          seq: (prev?.seq ?? 0) + 1,
        }));
        setLocationMessage(
          "GPS coordinates updated. Reverse geocoding address details...",
        );
        setLocating(false);
      },
      () => {
        setLocationMessage(
          "Location permission declined. Type your address or click the map directly.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!user) {
      openSignInDialog({
        tab: "citizen",
        mode: "signin",
        message: "Sign in as a Citizen to submit your report (your draft stays intact).",
      });
      return;
    }

    if (title.trim().length < 6) {
      setSubmitError("Issue title must be at least 6 characters.");
      return;
    }
    if (description.trim().length < 15) {
      setSubmitError("Description must be at least 15 characters.");
      return;
    }
    if (address.trim().length < 3) {
      setSubmitError("Please provide a street address or landmark.");
      return;
    }
    if (city.trim().length < 2) {
      setSubmitError("Please provide the city name.");
      return;
    }
    if (stateName.trim().length < 2) {
      setSubmitError("Please provide the state name.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("address", address.trim());
      formData.append("city", city.trim());
      formData.append("state", stateName.trim());
      formData.append("district", district.trim());
      formData.append("lat", String(lat));
      formData.append("lng", String(lng));
      if (categoryOverride) {
        formData.append("categoryOverride", categoryOverride);
      }
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/issues", {
        method: "POST",
        credentials: "same-origin",
        headers: authHeaders,
        body: formData,
      });

      if (res.status === 401) {
        setSubmitting(false);
        openSignInDialog({
          tab: "citizen",
          mode: "signin",
          message: "Your session expired. Sign in as a Citizen to submit.",
        });
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        issue?: { id: string };
        error?: string;
        rejected?: boolean;
        aiAnalysis?: AIAnalysis;
      };

      if (data.aiAnalysis) {
        setAnalysis(data.aiAnalysis);
      }

      if (!res.ok || !data.issue) {
        setSubmitError(
          data.error || "Unable to submit issue report. Please check your inputs.",
        );
        setSubmitting(false);
        return;
      }

      router.push(`/issues/${data.issue.id}`);
    } catch {
      setSubmitError("Network error while submitting report. Please try again.");
      setSubmitting(false);
    }
  };

  if (user && user.role !== "citizen") {
    return (
      <section
        role="alert"
        className="mt-7 rounded-2xl border border-[#FECACA] bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#991B1B]">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#991B1B]">
          HTTP 403 • Citizen Account Required
        </p>
        <h2 className="mt-1 font-headline text-xl font-bold text-[#0F172A]">
          403 Restricted — Citizens Only
        </h2>
        <p className="mt-2 text-sm text-[#475569]">
          You are currently signed in as{" "}
          <strong>
            {user.role === "worker" ? "Field Worker" : "Municipal Authority"}
          </strong>{" "}
          ({user.displayName}). Citizen issue reporting is restricted to Citizen
          accounts.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={user.role === "worker" ? "/worker" : "/admin"}
            className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
          >
            {user.role === "worker"
              ? "Go to Field Tasks"
              : "Go to Authority Console"}
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
          >
            View Public Feed
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-7 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      {/* Left Column: Issue Report Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8 lg:col-span-7"
      >
        {!user && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <UserCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-[#1E40AF]"
                aria-hidden="true"
              />
              <p className="text-xs font-medium text-[#1E40AF]">
                Sign in as a Citizen to submit this report and track updates on{" "}
                <strong>My Reported Issues</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openSignInDialog({ tab: "citizen", mode: "signin" })
              }
              className="shrink-0 rounded-lg bg-[#1B365D] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#002046]"
            >
              Citizen Sign In
            </button>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]"
          >
            {submitError}
          </div>
        )}

        <div>
          <label
            htmlFor="issue-title"
            className="block text-sm font-semibold text-[#0F172A]"
          >
            Issue Title <span className="text-[#991B1B]">*</span>
          </label>
          <input
            id="issue-title"
            name="title"
            type="text"
            required
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby="issue-title-hint"
            placeholder="e.g., Deep pothole near RS Puram bus stop"
            className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
          />
          <p id="issue-title-hint" className="mt-1 text-xs text-[#475569]">
            Summarize the hazard clearly (minimum 6 characters).
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="issue-description"
              className="block text-sm font-semibold text-[#0F172A]"
            >
              Detailed Description <span className="text-[#991B1B]">*</span>
            </label>
            <span className="text-xs font-medium tabular-nums text-[#64748B]">
              {description.length} / 1,000 characters
            </span>
          </div>
          <textarea
            id="issue-description"
            name="description"
            required
            rows={4}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby="issue-desc-hint"
            placeholder="Describe severity, nearby landmarks, transit stops/schools, and immediate safety risks..."
            className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm leading-relaxed text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
          />
          <p id="issue-desc-hint" className="mt-1 text-xs text-[#475569]">
            Gemini AI analyzes your description and photo together to compute
            urgency and municipal department routing.
          </p>
        </div>

        {/* Location Picker + Reverse Geocoding + Autocomplete + GPS */}
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
              onClick={handleUseMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1B365D] transition-colors hover:bg-[#EFF6FF] disabled:opacity-60"
            >
              {locating ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
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
              onChange={(e) => setAddress(e.target.value)}
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
                onChange={(e) => setCity(e.target.value)}
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
                onChange={(e) => setStateName(e.target.value)}
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
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g., RS Puram"
                className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:bg-white"
              />
            </div>
          </div>

          {locationMessage && (
            <p className="text-xs font-medium text-[#0F766E]">
              {locationMessage}
            </p>
          )}

          <CivicMap
            mode="picker"
            centerLat={lat}
            centerLng={lng}
            addressInputRef={addressInputRef}
            externalCoords={externalCoords}
            onLocationSelect={handleMapLocationSelect}
          />
        </div>

        {/* Category Override */}
        <div>
          <label
            htmlFor="issue-category"
            className="block text-sm font-semibold text-[#0F172A]"
          >
            Category (Optional)
          </label>
          <select
            id="issue-category"
            name="categoryOverride"
            value={categoryOverride}
            onChange={(e) => setCategoryOverride(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#0F172A] focus:bg-white"
          >
            <option value="">Auto-detect with Gemini AI</option>
            {ISSUE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Photo Evidence Upload (Max 1 photo <= 5 MB) */}
        <div className="space-y-2.5">
          <label
            htmlFor="issue-photo"
            className="block text-sm font-semibold text-[#0F172A]"
          >
            Photo Evidence (Optional — 1 photo up to 5 MB)
          </label>
          <div className="rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-center transition-colors hover:border-[#0369A1]">
            <Camera
              className="mx-auto h-7 w-7 text-[#0369A1]"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-semibold text-[#0F172A]">
              Attach field photo for Gemini multimodal triage
            </p>
            <p className="mt-0.5 text-xs text-[#475569]">
              Maximum 1 photo up to 5 MB (JPEG, PNG, or WebP)
            </p>
            <input
              ref={fileInputRef}
              id="issue-photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              aria-describedby="photo-upload-error"
              className="mt-3 block w-full cursor-pointer text-xs text-[#475569] file:mr-3 file:rounded-lg file:border file:border-[#CBD5E1] file:bg-white file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-[#1B365D] hover:file:bg-[#EFF6FF]"
            />
          </div>

          {photoError && (
            <p
              id="photo-upload-error"
              role="alert"
              className="text-xs font-semibold text-[#991B1B]"
            >
              {photoError}
            </p>
          )}

          {photoFile && photoPreviewUrl && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-white p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F1F5F9]">
                  <Image
                    src={photoPreviewUrl}
                    alt={`Preview of ${photoFile.name}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#0F172A]">
                    {photoFile.name}
                  </p>
                  <p className="text-[11px] text-[#475569]">
                    {(photoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for
                    Gemini Vision
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemovePhoto}
                aria-label="Remove attached photo"
                className="rounded-lg p-2 text-[#475569] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#002046] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Submitting &amp; Triaging...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                Submit Issue Report
              </>
            )}
          </button>
        </div>
      </form>

      {/* Right Column: Sticky Gemini AI Triage Card */}
      <div className="lg:sticky lg:top-24 lg:col-span-5">
        <GeminiTriageCard
          analysis={analysis}
          analyzing={analyzing}
          canRefresh={title.trim().length >= 4 && description.trim().length >= 10}
          onRefreshPreview={() => void runTriagePreview()}
        />
      </div>
    </div>
  );
}
