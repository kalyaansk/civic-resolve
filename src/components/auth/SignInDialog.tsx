"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  Wrench,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth, type PortalTab } from "@/components/auth/AuthProvider";
import type { UserProfile } from "@/types/issue";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: PortalTab;
  initialMode?: "signin" | "register";
  returnTo?: string;
  bannerMessage?: string;
}

function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
    </div>
  );
}

export function SignInDialog({
  open,
  onOpenChange,
  initialTab = "citizen",
  initialMode = "signin",
  returnTo,
  bannerMessage,
}: SignInDialogProps) {
  const router = useRouter();
  const {
    firebaseConfigured,
    demoEnabled,
    signInDemoCitizen,
    signInDemoWorker,
    signInDemoAdmin,
    signInEmail,
    signUpEmail,
    signInGoogle,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);
  const [citizenMode, setCitizenMode] = useState<"signin" | "register">(
    initialMode,
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const finishAuthNavigation = (profile: UserProfile, fromTab: PortalTab) => {
    if (fromTab === "authority") {
      if (profile.role === "authority") {
        onOpenChange(false);
        router.push("/admin");
        return;
      }
      setNotice(
        `This account holds ${profile.role === "worker" ? "Field Worker" : "Citizen"} access rather than Municipal Authority privileges. Routing to your workspace.`,
      );
      setTimeout(() => {
        onOpenChange(false);
        router.push(profile.role === "worker" ? "/worker" : "/");
      }, 900);
      return;
    }

    if (fromTab === "worker") {
      if (profile.role === "worker") {
        onOpenChange(false);
        router.push("/worker");
        return;
      }
      setNotice(
        `This account holds ${profile.role === "authority" ? "Authority" : "Citizen"} access rather than Field Worker privileges. Routing to your workspace.`,
      );
      setTimeout(() => {
        onOpenChange(false);
        router.push(profile.role === "authority" ? "/admin" : "/");
      }, 900);
      return;
    }

    onOpenChange(false);
    if (returnTo) {
      router.push(returnTo);
    }
  };

  const runAuthAction = async (
    action: () => Promise<UserProfile>,
    fromTab: PortalTab,
    fallbackError: string,
  ) => {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const profile = await action();
      finishAuthNavigation(profile, fromTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCitizenSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runAuthAction(
      () =>
        citizenMode === "signin"
          ? signInEmail(email, password)
          : signUpEmail(email, password, displayName),
      "citizen",
      "Citizen authentication failed.",
    );
  };

  const handleWorkerSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runAuthAction(
      () => signInEmail(email, password),
      "worker",
      "Field Worker sign-in failed.",
    );
  };

  const handleAuthoritySubmit = (e: FormEvent) => {
    e.preventDefault();
    void runAuthAction(
      () => signInEmail(email, password),
      "authority",
      "Authority sign-in failed.",
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0F172A]/55 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby="auth-dialog-description"
          className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl focus:outline-none"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B365D] text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <Dialog.Title className="font-headline text-lg font-bold text-[#0F172A]">
                  CivicResolve Access Portal
                </Dialog.Title>
                <Dialog.Description
                  id="auth-dialog-description"
                  className="text-xs text-[#475569]"
                >
                  Sign in as a Citizen, Field Worker, or Municipal Authority.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              aria-label="Close sign in dialog"
              className="rounded-lg p-1.5 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {bannerMessage && (
            <div className="mt-4 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2.5 text-xs font-medium text-[#1E40AF]">
              {bannerMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-2.5 text-xs font-medium text-[#92400E]"
            >
              {notice}
            </div>
          )}

          <Tabs.Root
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as PortalTab);
              setError(null);
              setNotice(null);
            }}
            className="mt-5"
          >
            <Tabs.List
              aria-label="Account role portal"
              className="grid grid-cols-3 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9] p-1"
            >
              <Tabs.Trigger
                value="citizen"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-[#475569] transition-colors data-[state=active]:bg-[#1B365D] data-[state=active]:text-white"
              >
                Citizen
              </Tabs.Trigger>
              <Tabs.Trigger
                value="worker"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-[#475569] transition-colors data-[state=active]:bg-[#1B365D] data-[state=active]:text-white"
              >
                Field Worker
              </Tabs.Trigger>
              <Tabs.Trigger
                value="authority"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-[#475569] transition-colors data-[state=active]:bg-[#1B365D] data-[state=active]:text-white"
              >
                Authority
              </Tabs.Trigger>
            </Tabs.List>

            {/* Tab 1: Citizen (Demo Login at top -> Google / Email Sign-In & Register) */}
            <Tabs.Content
              value="citizen"
              className="mt-4 space-y-4 focus:outline-none"
            >
              {demoEnabled && (
                <>
                  <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
                        <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Evaluator / Demo Citizen Access
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
                        Citizen Role
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#334155]">
                      Test reporting issues, toggling upvotes, and tracking
                      submissions on <code>/my-issues</code> immediately.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void runAuthAction(
                          signInDemoCitizen,
                          "citizen",
                          "Demo Citizen login failed.",
                        )
                      }
                      disabled={submitting}
                      className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0369A1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#075985] disabled:opacity-60"
                    >
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Demo Citizen Login
                    </button>
                  </div>

                  <OrDivider label="or sign in or register with email" />
                </>
              )}

              <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs">
                <span className="font-semibold text-[#0F172A]">
                  {citizenMode === "signin"
                    ? "Citizen Sign In"
                    : "Register New Citizen Account"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCitizenMode((prev) =>
                      prev === "signin" ? "register" : "signin",
                    )
                  }
                  className="font-semibold text-[#0369A1] underline hover:text-[#1B365D]"
                >
                  {citizenMode === "signin"
                    ? "Need an account? Register"
                    : "Already registered? Sign In"}
                </button>
              </div>

              {firebaseConfigured ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void runAuthAction(
                        signInGoogle,
                        "citizen",
                        "Google Sign-In failed.",
                      )
                    }
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
                  >
                    Continue with Google (Citizen)
                  </button>

                  <form onSubmit={handleCitizenSubmit} className="space-y-3">
                    {citizenMode === "register" && (
                      <div>
                        <label
                          htmlFor="citizen-display-name"
                          className="block text-xs font-semibold text-[#0F172A]"
                        >
                          Full Name
                        </label>
                        <input
                          id="citizen-display-name"
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g., Priya Subramanian"
                          className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="citizen-email"
                        className="block text-xs font-semibold text-[#0F172A]"
                      >
                        Email Address
                      </label>
                      <input
                        id="citizen-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="citizen@example.com"
                        className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="citizen-password"
                        className="block text-xs font-semibold text-[#0F172A]"
                      >
                        Password
                      </label>
                      <input
                        id="citizen-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#002046] disabled:opacity-60"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {citizenMode === "signin"
                        ? "Sign In as Citizen"
                        : "Register Citizen Account"}
                    </button>
                  </form>
                </>
              ) : (
                <p className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                  Firebase Web Auth keys are not configured in this environment.
                  Use Demo Citizen Login above.
                </p>
              )}
            </Tabs.Content>

            {/* Tab 2: Field Worker (Demo Worker Login at top -> Pre-authorized Official Worker Credentials) */}
            <Tabs.Content
              value="worker"
              className="mt-4 space-y-4 focus:outline-none"
            >
              {demoEnabled && (
                <>
                  <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#92400E]">
                        <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                        Evaluator / Demo Field Worker Access
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#92400E]">
                        Worker RBAC
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#334155]">
                      Signs in as{" "}
                      <strong>R. Selvam (Demo Field Worker)</strong> for the{" "}
                      <code>/worker</code> crew execution &amp; after-repair AI
                      verification workflow.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void runAuthAction(
                          signInDemoWorker,
                          "worker",
                          "Demo Field Worker login failed.",
                        )
                      }
                      disabled={submitting}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#92400E] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#78350F] disabled:opacity-60"
                    >
                      <Wrench className="h-4 w-4" aria-hidden="true" />
                      Demo Field Worker Login
                    </button>
                  </div>

                  <OrDivider label="or sign in with official worker credentials" />
                </>
              )}

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs text-[#334155]">
                <p className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                  <Lock className="h-3.5 w-3.5 text-[#1B365D]" aria-hidden="true" />
                  Official Field Worker Access Only
                </p>
                <p className="mt-1 leading-relaxed text-[#475569]">
                  Field crew accounts cannot self-register. Crew emails are
                  pre-authorized via the <code>WORKER_EMAILS</code> allowlist or
                  Firestore role claims.
                </p>
              </div>

              {firebaseConfigured && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void runAuthAction(
                        signInGoogle,
                        "worker",
                        "Google Sign-In failed.",
                      )
                    }
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
                  >
                    Official Worker Google Sign-In
                  </button>

                  <form onSubmit={handleWorkerSubmit} className="space-y-3">
                    <div>
                      <label
                        htmlFor="worker-email"
                        className="block text-xs font-semibold text-[#0F172A]"
                      >
                        Official Worker Email
                      </label>
                      <input
                        id="worker-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="worker@civicresolve.gov"
                        className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="worker-password"
                        className="block text-xs font-semibold text-[#0F172A]"
                      >
                        Password
                      </label>
                      <input
                        id="worker-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter worker password"
                        className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#002046] disabled:opacity-60"
                    >
                      <Wrench className="h-4 w-4" aria-hidden="true" />
                      Sign In to Field Worker Portal
                    </button>
                  </form>
                </>
              )}
            </Tabs.Content>

            {/* Tab 3: Municipal Authority (Demo Authority at top -> Official Sign-In Only) */}
            <Tabs.Content
              value="authority"
              className="mt-4 space-y-4 focus:outline-none"
            >
              {demoEnabled && (
                <>
                  <div className="rounded-xl border border-[#99EFE5] bg-[#F0FDFA] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                        <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                        Evaluator / Demo Authority Access
                      </span>
                      <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-semibold text-[#0F766E]">
                        Authority RBAC
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#334155]">
                      Signs an HMAC-verified <code>HttpOnly</code> session cookie
                      as <strong>M. Alvarez (Demo Authority)</strong> for the{" "}
                      <code>/admin</code> dispatch &amp; approval workflow.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void runAuthAction(
                          signInDemoAdmin,
                          "authority",
                          "Demo Authority login failed.",
                        )
                      }
                      disabled={submitting}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#115E59] disabled:opacity-60"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Evaluator / Demo Authority Access
                    </button>
                  </div>

                  <OrDivider label="or sign in with official credentials" />
                </>
              )}

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs text-[#334155]">
                <p className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                  <Lock className="h-3.5 w-3.5 text-[#1B365D]" aria-hidden="true" />
                  Official Sign-In Only
                </p>
                <p className="mt-1 leading-relaxed text-[#475569]">
                  Municipal Authority accounts cannot self-register. Official
                  access is pre-authorized by the City Administrator via the{" "}
                  <code>ADMIN_EMAILS</code> allowlist or Firestore role claims.
                </p>
              </div>

              {firebaseConfigured && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void runAuthAction(
                        signInGoogle,
                        "authority",
                        "Google Sign-In failed.",
                      )
                    }
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
                  >
                    Official Google Sign-In
                  </button>

                  <form onSubmit={handleAuthoritySubmit} className="space-y-3">
                    <div>
                      <label
                        htmlFor="authority-email"
                        className="block text-xs font-semibold text-[#0F172A]"
                      >
                        Official Municipal Email
                      </label>
                      <input
                        id="authority-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="official@civicresolve.gov"
                        className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="authority-password"
                        className="block text-xs font-semibold text-[#0F172A]"
                      >
                        Password
                      </label>
                      <input
                        id="authority-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter official password"
                        className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#002046] disabled:opacity-60"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Sign In to Authority Console
                    </button>
                  </form>
                </>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
