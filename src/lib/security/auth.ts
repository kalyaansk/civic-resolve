import crypto from "node:crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { UserRole } from "@/types/issue";

/**
 * Server-side 3-tier RBAC verification supporting:
 * 1. Firebase ID Token (`Authorization: Bearer <token>`) verified via Firebase Admin Auth.
 *    - Emails in `ADMIN_EMAILS`, Firestore `users/{uid}.role` in `['admin', 'authority']`,
 *      or custom claims `admin`/`authority` receive `authority`.
 *    - Emails in `WORKER_EMAILS`, Firestore `users/{uid}.role === 'worker'`,
 *      or custom claim `worker` receive `worker`.
 *    - All other verified Firebase users receive `citizen`.
 * 2. HMAC-signed `HttpOnly` Demo Authority cookie (`civic_demo_admin`) when demo mode is enabled.
 * 3. HMAC-signed `HttpOnly` Demo Field Worker cookie (`civic_demo_worker`) when demo mode is enabled.
 * 4. HMAC-signed `HttpOnly` Demo Citizen cookie (`civic_demo_citizen`) when demo mode is enabled.
 */

export const DEMO_ADMIN_COOKIE_NAME = "civic_demo_admin";
export const DEMO_WORKER_COOKIE_NAME = "civic_demo_worker";
export const DEMO_CITIZEN_COOKIE_NAME = "civic_demo_citizen";
const DEMO_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface RequestAuthResult {
  authenticated: boolean;
  role: UserRole | null;
  /** Strictly true only when the caller holds the Municipal Authority (`authority`) role. */
  authorized: boolean;
  actor: string;
  displayName: string;
  email: string | null;
  uid: string | null;
  isDemo: boolean;
}

export type AdminAuthResult = RequestAuthResult;

function getDemoSecret(): string {
  return (
    process.env.DEMO_ADMIN_SESSION_SECRET?.trim() ||
    "civicresolve-local-demo-admin-signing-key-2026"
  );
}

/** Returns true unless explicitly disabled with `DEMO_ADMIN_ENABLED=false`. */
export function isDemoAdminEnabled(): boolean {
  return process.env.DEMO_ADMIN_ENABLED !== "false";
}

function parseEmailAllowlist(envVar: string | undefined, fallback: string): Set<string> {
  const raw = envVar ?? fallback;
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function parseAdminEmails(): Set<string> {
  return parseEmailAllowlist(process.env.ADMIN_EMAILS, "admin@civicresolve.gov");
}

function parseWorkerEmails(): Set<string> {
  return parseEmailAllowlist(process.env.WORKER_EMAILS, "worker@civicresolve.gov");
}

function signPayload(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getDemoSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function createSignedDemoToken(payload: {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}): string {
  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + DEMO_SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString(
    "base64url",
  );
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

function normalizeDemoRole(rawRole: string | undefined): UserRole | null {
  if (rawRole === "admin" || rawRole === "authority") return "authority";
  if (rawRole === "worker") return "worker";
  if (rawRole === "citizen") return "citizen";
  return null;
}

function defaultIdentityForRole(role: UserRole): {
  uid: string;
  email: string;
  name: string;
} {
  switch (role) {
    case "authority":
      return {
        uid: "demo-admin",
        email: "ops.lead@civicresolve.gov",
        name: "M. Alvarez (Demo Authority)",
      };
    case "worker":
      return {
        uid: "demo-worker",
        email: "worker.demo@civicresolve.gov",
        name: "R. Selvam (Demo Field Worker)",
      };
    case "citizen":
      return {
        uid: "demo-citizen",
        email: "citizen.demo@civicresolve.gov",
        name: "Aarav K. (Demo Citizen)",
      };
  }
}

function verifySignedDemoToken(
  token: string | undefined,
  expectedRole: UserRole,
): {
  valid: boolean;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
} | null {
  if (!token || !isDemoAdminEnabled()) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as {
      sub?: string;
      email?: string;
      name?: string;
      role?: string;
      exp?: number;
    };
    const normalized = normalizeDemoRole(parsed.role);
    if (
      normalized !== expectedRole ||
      !parsed.exp ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    const defaults = defaultIdentityForRole(expectedRole);
    return {
      valid: true,
      uid: parsed.sub ?? defaults.uid,
      email: parsed.email ?? defaults.email,
      name: parsed.name ?? defaults.name,
      role: expectedRole,
    };
  } catch {
    return null;
  }
}

/** Creates an HMAC-signed token for the Demo Authority HttpOnly cookie. */
export function createDemoAdminToken(): string {
  const identity = defaultIdentityForRole("authority");
  return createSignedDemoToken({
    sub: identity.uid,
    email: identity.email,
    name: identity.name,
    role: "authority",
  });
}

/** Creates an HMAC-signed token for the Demo Field Worker HttpOnly cookie. */
export function createDemoWorkerToken(): string {
  const identity = defaultIdentityForRole("worker");
  return createSignedDemoToken({
    sub: identity.uid,
    email: identity.email,
    name: identity.name,
    role: "worker",
  });
}

/** Creates an HMAC-signed token for the Demo Citizen HttpOnly cookie. */
export function createDemoCitizenToken(): string {
  const identity = defaultIdentityForRole("citizen");
  return createSignedDemoToken({
    sub: identity.uid,
    email: identity.email,
    name: identity.name,
    role: "citizen",
  });
}

/** Verifies the HMAC-signed Demo Authority cookie token safely. */
export function verifyDemoAdminToken(token: string | undefined) {
  return verifySignedDemoToken(token, "authority");
}

/** Verifies the HMAC-signed Demo Field Worker cookie token safely. */
export function verifyDemoWorkerToken(token: string | undefined) {
  return verifySignedDemoToken(token, "worker");
}

/** Verifies the HMAC-signed Demo Citizen cookie token safely. */
export function verifyDemoCitizenToken(token: string | undefined) {
  return verifySignedDemoToken(token, "citizen");
}

/** Reads a named cookie value from the standard `Cookie` request header. */
export function extractCookie(
  cookieHeader: string | null,
  cookieName: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key === cookieName) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return undefined;
}

/**
 * Strips raw email addresses before persisting or exposing `reporterName` publicly.
 */
export function getSafePublicReporterName(
  displayName?: string | null,
  email?: string | null,
): string {
  const candidate = displayName?.trim() ?? "";
  if (candidate && !candidate.includes("@")) {
    return candidate.slice(0, 80);
  }
  if (email && email.includes("@")) {
    const handle = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    if (handle) {
      const formatted = handle.replace(/\b\w/g, (ch) => ch.toUpperCase());
      return `${formatted.slice(0, 40)} (Verified Citizen)`;
    }
  }
  return "Verified Citizen";
}

/**
 * Verifies the incoming request across Firebase Auth Bearer tokens and Demo cookies.
 * `authorized` is true strictly when the verified caller holds the Municipal Authority (`authority`) role.
 */
export async function verifyRequestAuth(
  request: Request,
): Promise<RequestAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.slice("Bearer ".length).trim();
    const adminAuth = getAdminAuth();
    if (adminAuth && idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const email = decoded.email?.toLowerCase() ?? null;
        const adminAllowlisted = email ? parseAdminEmails().has(email) : false;
        const workerAllowlisted = email
          ? parseWorkerEmails().has(email)
          : false;

        let userDocRole: string | undefined;
        if (!adminAllowlisted && !workerAllowlisted) {
          const db = getAdminDb();
          if (db) {
            const userSnap = await db.collection("users").doc(decoded.uid).get();
            const rawRole = userSnap.data()?.role;
            if (typeof rawRole === "string") {
              userDocRole = rawRole;
            }
          }
        }

        const isAuthority =
          adminAllowlisted ||
          userDocRole === "admin" ||
          userDocRole === "authority" ||
          decoded.admin === true ||
          decoded.authority === true;

        const isWorker =
          !isAuthority &&
          (workerAllowlisted ||
            userDocRole === "worker" ||
            decoded.worker === true);

        const role: UserRole = isAuthority
          ? "authority"
          : isWorker
            ? "worker"
            : "citizen";

        const displayName =
          (typeof decoded.name === "string" && decoded.name.trim()) ||
          getSafePublicReporterName(null, email);

        return {
          authenticated: true,
          role,
          authorized: role === "authority",
          actor: displayName,
          displayName,
          email,
          uid: decoded.uid,
          isDemo: false,
        };
      } catch {
        return {
          authenticated: false,
          role: null,
          authorized: false,
          actor: "Unauthenticated",
          displayName: "Visitor",
          email: null,
          uid: null,
          isDemo: false,
        };
      }
    }
  }

  const cookieHeader = request.headers.get("cookie");

  const adminToken = extractCookie(cookieHeader, DEMO_ADMIN_COOKIE_NAME);
  const demoAdmin = verifyDemoAdminToken(adminToken);
  if (demoAdmin?.valid) {
    return {
      authenticated: true,
      role: "authority",
      authorized: true,
      actor: demoAdmin.name,
      displayName: demoAdmin.name,
      email: demoAdmin.email,
      uid: demoAdmin.uid,
      isDemo: true,
    };
  }

  const workerToken = extractCookie(cookieHeader, DEMO_WORKER_COOKIE_NAME);
  const demoWorker = verifyDemoWorkerToken(workerToken);
  if (demoWorker?.valid) {
    return {
      authenticated: true,
      role: "worker",
      authorized: false,
      actor: demoWorker.name,
      displayName: demoWorker.name,
      email: demoWorker.email,
      uid: demoWorker.uid,
      isDemo: true,
    };
  }

  const citizenToken = extractCookie(cookieHeader, DEMO_CITIZEN_COOKIE_NAME);
  const demoCitizen = verifyDemoCitizenToken(citizenToken);
  if (demoCitizen?.valid) {
    return {
      authenticated: true,
      role: "citizen",
      authorized: false,
      actor: demoCitizen.name,
      displayName: demoCitizen.name,
      email: demoCitizen.email,
      uid: demoCitizen.uid,
      isDemo: true,
    };
  }

  return {
    authenticated: false,
    role: null,
    authorized: false,
    actor: "Unauthenticated",
    displayName: "Visitor",
    email: null,
    uid: null,
    isDemo: false,
  };
}

/**
 * Verifies whether the incoming HTTP request belongs to an authenticated Municipal Authority.
 */
export async function verifyAdminRequest(
  request: Request,
): Promise<AdminAuthResult> {
  return verifyRequestAuth(request);
}
