"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth, type PortalTab } from "@/components/auth/AuthProvider";
import { CitizenAuthTab } from "@/components/auth/CitizenAuthTab";
import { StaffAuthTab } from "@/components/auth/StaffAuthTab";
import type { UserProfile } from "@/types/issue";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: PortalTab;
  initialMode?: "signin" | "register";
  returnTo?: string;
  bannerMessage?: string;
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

  const handleStaffSubmit = (role: "worker" | "authority") => (e: FormEvent) => {
    e.preventDefault();
    void runAuthAction(
      () => signInEmail(email, password),
      role,
      role === "worker"
        ? "Field Worker sign-in failed."
        : "Authority sign-in failed.",
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

            <Tabs.Content value="citizen" className="focus:outline-none">
              <CitizenAuthTab
                demoEnabled={demoEnabled}
                firebaseConfigured={firebaseConfigured}
                submitting={submitting}
                citizenMode={citizenMode}
                onToggleMode={() =>
                  setCitizenMode((prev) =>
                    prev === "signin" ? "register" : "signin",
                  )
                }
                displayName={displayName}
                onDisplayNameChange={setDisplayName}
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                onDemoLogin={() =>
                  void runAuthAction(
                    signInDemoCitizen,
                    "citizen",
                    "Demo Citizen login failed.",
                  )
                }
                onGoogleLogin={() =>
                  void runAuthAction(
                    signInGoogle,
                    "citizen",
                    "Google Sign-In failed.",
                  )
                }
                onSubmit={handleCitizenSubmit}
              />
            </Tabs.Content>

            <Tabs.Content value="worker" className="focus:outline-none">
              <StaffAuthTab
                role="worker"
                demoEnabled={demoEnabled}
                firebaseConfigured={firebaseConfigured}
                submitting={submitting}
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                onDemoLogin={() =>
                  void runAuthAction(
                    signInDemoWorker,
                    "worker",
                    "Demo Field Worker login failed.",
                  )
                }
                onGoogleLogin={() =>
                  void runAuthAction(
                    signInGoogle,
                    "worker",
                    "Google Sign-In failed.",
                  )
                }
                onSubmit={handleStaffSubmit("worker")}
              />
            </Tabs.Content>

            <Tabs.Content value="authority" className="focus:outline-none">
              <StaffAuthTab
                role="authority"
                demoEnabled={demoEnabled}
                firebaseConfigured={firebaseConfigured}
                submitting={submitting}
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                onDemoLogin={() =>
                  void runAuthAction(
                    signInDemoAdmin,
                    "authority",
                    "Demo Authority login failed.",
                  )
                }
                onGoogleLogin={() =>
                  void runAuthAction(
                    signInGoogle,
                    "authority",
                    "Google Sign-In failed.",
                  )
                }
                onSubmit={handleStaffSubmit("authority")}
              />
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
