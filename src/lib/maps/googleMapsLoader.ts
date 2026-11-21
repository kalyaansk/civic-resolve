/**
 * Singleton browser loader for Google Maps JavaScript API + Places library.
 * Returns null cleanly when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is missing or fails to load
 * so UI components can display an accessible interactive fallback map.
 */

let mapsPromise: Promise<typeof google.maps | null> | null = null;

export function isGoogleMapsConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return Boolean(key && key !== "your_google_maps_js_api_key");
}

export function loadGoogleMapsApi(): Promise<typeof google.maps | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || apiKey === "your_google_maps_js_api_key") {
    return Promise.resolve(null);
  }

  if (mapsPromise) {
    return mapsPromise;
  }

  mapsPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-civic-google-maps="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        resolve(window.google?.maps ?? null);
      });
      existingScript.addEventListener("error", () => {
        resolve(null);
      });
      return;
    }

    const script = document.createElement("script");
    script.dataset.civicGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(window.google?.maps ?? null);
    };
    script.onerror = () => {
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return mapsPromise;
}
