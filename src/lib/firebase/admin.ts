import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Server-side Firebase Admin SDK initialization strictly using Application Default
 * Credentials (ADC) — zero static service account JSON key files required.
 * Works seamlessly via `gcloud auth application-default login` locally and attached
 * IAM credentials on Google Cloud Run.
 */

let cachedApp: App | null | undefined;

function resolveProjectId(): string | undefined {
  const id =
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!id || id === "your_gcp_project_id") return undefined;
  return id;
}

function resolveStorageBucket(): string | undefined {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucket || bucket === "your_project.firebasestorage.app") {
    return undefined;
  }
  return bucket;
}

function hasLocalGcloudAdcFile(): boolean {
  try {
    const unixPath = path.join(
      os.homedir(),
      ".config",
      "gcloud",
      "application_default_credentials.json",
    );
    if (fs.existsSync(unixPath)) return true;

    const appData = process.env.APPDATA?.trim();
    if (appData) {
      const winPath = path.join(
        appData,
        "gcloud",
        "application_default_credentials.json",
      );
      if (fs.existsSync(winPath)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Returns true if a Google Cloud project ID and either Cloud Run metadata,
 * ADC environment variables, or local `gcloud auth application-default login`
 * credentials are available.
 */
export function isFirebaseAdminConfigured(): boolean {
  const projectId = resolveProjectId();
  if (!projectId) return false;
  const hasAdcEnv = Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE || // Cloud Run runtime
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.GCLOUD_PROJECT,
  );
  return (
    hasAdcEnv ||
    hasLocalGcloudAdcFile() ||
    process.env.NODE_ENV === "production"
  );
}

function getOrInitAdminApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;

  const projectId = resolveProjectId();
  if (!projectId) {
    cachedApp = null;
    return null;
  }

  try {
    if (getApps().length > 0) {
      cachedApp = getApps()[0] ?? null;
      return cachedApp;
    }

    const storageBucket = resolveStorageBucket();
    cachedApp = initializeApp({
      credential: applicationDefault(),
      projectId,
      ...(storageBucket ? { storageBucket } : {}),
    });
    return cachedApp;
  } catch (error) {
    console.warn(
      "[CivicResolve Firebase Admin] ADC unavailable; using local fallback store:",
      error instanceof Error ? error.message : "Unknown error",
    );
    cachedApp = null;
    return null;
  }
}

/** Returns the Firestore Admin instance when ADC + projectId are available, else null. */
export function getAdminDb(): Firestore | null {
  if (!isFirebaseAdminConfigured() && !process.env.FIRESTORE_EMULATOR_HOST) {
    return null;
  }
  const app = getOrInitAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

/** Returns the Firebase Storage Admin instance when configured, else null. */
export function getAdminStorage(): Storage | null {
  if (!isFirebaseAdminConfigured()) return null;
  const app = getOrInitAdminApp();
  if (!app) return null;
  return getStorage(app);
}

/** Returns the Firebase Auth Admin instance for ID token verification, else null. */
export function getAdminAuth(): Auth | null {
  if (!isFirebaseAdminConfigured()) return null;
  const app = getOrInitAdminApp();
  if (!app) return null;
  return getAuth(app);
}
