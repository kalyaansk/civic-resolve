import type { User as FirebaseUser } from "firebase/auth";
import type { UserProfile, UserRole } from "@/types/issue";

export interface ServerSessionResponse {
  authenticated: boolean;
  authorized: boolean;
  role: string | null;
  actor: string;
  displayName: string;
  email: string | null;
  uid: string | null;
  isDemo: boolean;
  demoEnabled: boolean;
}

export function normalizeUserRole(rawRole: string | null | undefined): UserRole {
  if (rawRole === "admin" || rawRole === "authority") return "authority";
  if (rawRole === "worker") return "worker";
  return "citizen";
}

export function mapFirebaseUser(
  fbUser: FirebaseUser,
  role: UserRole,
): UserProfile {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? "",
    displayName: fbUser.displayName || fbUser.email || "Verified Citizen",
    role,
    isDemo: false,
  };
}

export async function fetchServerSession(
  idToken?: string,
): Promise<ServerSessionResponse | null> {
  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerSessionResponse;
  } catch {
    return null;
  }
}

export async function startDemoRoleSession(
  endpoint: string,
  role: UserRole,
  fallbackError: string,
): Promise<UserProfile> {
  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || fallbackError);
  }
  const data = (await res.json()) as {
    user: { uid: string; name: string; email: string };
  };
  return {
    uid: data.user.uid,
    email: data.user.email,
    displayName: data.user.name,
    role,
    isDemo: true,
  };
}

export async function clearAllDemoSessions(): Promise<void> {
  await Promise.all([
    fetch("/api/auth/demo-admin", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => undefined),
    fetch("/api/auth/demo-worker", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => undefined),
    fetch("/api/auth/demo-citizen", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => undefined),
  ]);
}
