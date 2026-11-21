"use client";

import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SignInDialog } from "@/components/auth/SignInDialog";
import {
  getFirebaseAuth,
  isFirebaseClientConfigured,
  signInWithEmail,
  signInWithGoogle,
  signOutFirebaseUser,
  signUpWithEmail,
} from "@/lib/firebase/client";
import type { UserProfile, UserRole } from "@/types/issue";

export type PortalTab = UserRole;

export interface OpenSignInOptions {
  tab?: PortalTab;
  mode?: "signin" | "register";
  returnTo?: string;
  message?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  firebaseConfigured: boolean;
  demoEnabled: boolean;
  openSignInDialog: (options?: OpenSignInOptions) => void;
  closeSignInDialog: () => void;
  signInDemoCitizen: () => Promise<UserProfile>;
  signInDemoWorker: () => Promise<UserProfile>;
  signInDemoAdmin: () => Promise<UserProfile>;
  signInEmail: (email: string, password: string) => Promise<UserProfile>;
  signUpEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<UserProfile>;
  signInGoogle: () => Promise<UserProfile>;
  signOut: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUserRole(rawRole: string | null | undefined): UserRole {
  if (rawRole === "admin" || rawRole === "authority") return "authority";
  if (rawRole === "worker") return "worker";
  return "citizen";
}

function mapFirebaseUser(
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseRole, setFirebaseRole] = useState<UserRole>("citizen");
  const [demoUser, setDemoUser] = useState<UserProfile | null>(null);
  const [demoEnabled, setDemoEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [dialogOptions, setDialogOptions] = useState<OpenSignInOptions>({
    tab: "citizen",
    mode: "signin",
  });

  const authMutationSeqRef = useRef(0);
  const firebaseConfigured = isFirebaseClientConfigured();

  const fetchServerSession = useCallback(async (idToken?: string) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "same-origin",
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });
      if (!res.ok) return null;
      return (await res.json()) as {
        authenticated: boolean;
        authorized: boolean;
        role: string | null;
        actor: string;
        displayName: string;
        email: string | null;
        uid: string | null;
        isDemo: boolean;
        demoEnabled: boolean;
      };
    } catch {
      return null;
    }
  }, []);

  const resolveFirebaseRole = useCallback(
    async (fbUser: FirebaseUser | null): Promise<UserRole> => {
      if (!fbUser) {
        setFirebaseRole("citizen");
        return "citizen";
      }
      try {
        const token = await fbUser.getIdToken();
        const session = await fetchServerSession(token);
        const role = normalizeUserRole(session?.role);
        setFirebaseRole(role);
        return role;
      } catch {
        setFirebaseRole("citizen");
        return "citizen";
      }
    },
    [fetchServerSession],
  );

  const refreshCookieSession = useCallback(async () => {
    const seq = authMutationSeqRef.current;
    const session = await fetchServerSession();
    if (!session || authMutationSeqRef.current !== seq) return;
    setDemoEnabled(session.demoEnabled);
    if (session.authenticated && session.isDemo && session.role && session.uid) {
      setDemoUser({
        uid: session.uid,
        email: session.email ?? "",
        displayName: session.displayName || session.actor,
        role: normalizeUserRole(session.role),
        isDemo: true,
      });
    } else {
      setDemoUser(null);
    }
  }, [fetchServerSession]);

  useEffect(() => {
    let active = true;
    const auth = getFirebaseAuth();
    let cookieInitDone = false;
    let firebaseInitDone = !auth;

    const maybeFinishLoading = () => {
      if (active && cookieInitDone && firebaseInitDone) {
        setLoading(false);
      }
    };

    const init = async () => {
      await refreshCookieSession();
      cookieInitDone = true;
      maybeFinishLoading();
    };
    void init();

    if (!auth) {
      return () => {
        active = false;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;
      setFirebaseUser(nextUser);
      await resolveFirebaseRole(nextUser);
      firebaseInitDone = true;
      maybeFinishLoading();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshCookieSession, resolveFirebaseRole]);

  const openSignInDialog = useCallback((options?: OpenSignInOptions) => {
    setDialogOptions({
      tab: options?.tab ?? "citizen",
      mode: options?.mode ?? "signin",
      returnTo: options?.returnTo,
      message: options?.message,
    });
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  }, []);

  const closeSignInDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const signInDemoCitizen = useCallback(async (): Promise<UserProfile> => {
    authMutationSeqRef.current += 1;
    const res = await fetch("/api/auth/demo-citizen", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error || "Unable to start Demo Citizen session.");
    }
    const data = (await res.json()) as {
      user: { uid: string; name: string; email: string };
    };
    const profile: UserProfile = {
      uid: data.user.uid,
      email: data.user.email,
      displayName: data.user.name,
      role: "citizen",
      isDemo: true,
    };
    setDemoUser(profile);
    return profile;
  }, []);

  const signInDemoWorker = useCallback(async (): Promise<UserProfile> => {
    authMutationSeqRef.current += 1;
    const res = await fetch("/api/auth/demo-worker", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        body.error || "Unable to start Demo Field Worker session.",
      );
    }
    const data = (await res.json()) as {
      user: { uid: string; name: string; email: string };
    };
    const profile: UserProfile = {
      uid: data.user.uid,
      email: data.user.email,
      displayName: data.user.name,
      role: "worker",
      isDemo: true,
    };
    setDemoUser(profile);
    return profile;
  }, []);

  const signInDemoAdmin = useCallback(async (): Promise<UserProfile> => {
    authMutationSeqRef.current += 1;
    const res = await fetch("/api/auth/demo-admin", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error || "Unable to start Demo Authority session.");
    }
    const data = (await res.json()) as {
      user: { uid: string; name: string; email: string };
    };
    const profile: UserProfile = {
      uid: data.user.uid,
      email: data.user.email,
      displayName: data.user.name,
      role: "authority",
      isDemo: true,
    };
    setDemoUser(profile);
    return profile;
  }, []);

  const signInEmail = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      authMutationSeqRef.current += 1;
      const fbUser = await signInWithEmail(email, password);
      setFirebaseUser(fbUser);
      setDemoUser(null);
      const role = await resolveFirebaseRole(fbUser);
      return mapFirebaseUser(fbUser, role);
    },
    [resolveFirebaseRole],
  );

  const signUpEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<UserProfile> => {
      authMutationSeqRef.current += 1;
      const fbUser = await signUpWithEmail(email, password, displayName);
      setFirebaseUser(fbUser);
      setDemoUser(null);
      const role = await resolveFirebaseRole(fbUser);
      return mapFirebaseUser(fbUser, role);
    },
    [resolveFirebaseRole],
  );

  const signInGoogle = useCallback(async (): Promise<UserProfile> => {
    authMutationSeqRef.current += 1;
    const fbUser = await signInWithGoogle();
    setFirebaseUser(fbUser);
    setDemoUser(null);
    const role = await resolveFirebaseRole(fbUser);
    return mapFirebaseUser(fbUser, role);
  }, [resolveFirebaseRole]);

  const signOut = useCallback(async () => {
    authMutationSeqRef.current += 1;
    await Promise.all([
      signOutFirebaseUser(),
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
    setFirebaseUser(null);
    setFirebaseRole("citizen");
    setDemoUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const getAuthHeaders = useCallback(async (): Promise<
    Record<string, string>
  > => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [firebaseUser]);

  const activeUser: UserProfile | null =
    demoUser ??
    (firebaseUser ? mapFirebaseUser(firebaseUser, firebaseRole) : null);

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        loading,
        firebaseConfigured,
        demoEnabled,
        openSignInDialog,
        closeSignInDialog,
        signInDemoCitizen,
        signInDemoWorker,
        signInDemoAdmin,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signOut,
        getAuthHeaders,
      }}
    >
      {children}
      <SignInDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTab={dialogOptions.tab}
        initialMode={dialogOptions.mode}
        returnTo={dialogOptions.returnTo}
        bannerMessage={dialogOptions.message}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return ctx;
}
