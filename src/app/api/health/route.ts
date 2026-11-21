import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isGoogleMapsConfigured } from "@/lib/maps/googleMapsLoader";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — Cloud Run health check and Google service configuration status.
 */
export async function GET(): Promise<NextResponse> {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY?.trim() &&
      process.env.GEMINI_API_KEY.trim() !== "your_gemini_api_key_here",
  );

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        firestore: isFirebaseAdminConfigured() ? "adc-configured" : "memory-fallback",
        gemini: geminiConfigured ? "configured" : "deterministic-fallback",
        maps: isGoogleMapsConfigured() ? "configured" : "interactive-fallback",
      },
    },
    { status: 200 },
  );
}
