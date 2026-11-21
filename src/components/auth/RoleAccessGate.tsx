"use client";

import { KeyRound, Lock, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

interface RoleAccessGateProps {
  requiredRole: "authority" | "worker";
  returnTo: string;
  authSubtitle?: string;
  authDescription?: string;
  forbiddenDescription?: string;
}

/**
 * Shared role-enforcement screen for Authority and Field Worker routes:
 * handles session loading, strict 403 Restricted alerts, and Sign-In gates.
 */
export function RoleAccessGate({
  requiredRole,
  returnTo,
  authSubtitle,
  authDescription,
  forbiddenDescription,
}: RoleAccessGateProps) {
  const {
    user,
    loading,
    demoEnabled,
    signInDemoAdmin,
    signInDemoWorker,
    openSignInDialog,
  } = useAuth();

  const isAuthorityRequired = requiredRole === "authority";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-12">
        <p className="text-sm font-medium text-[#475569]">
          {isAuthorityRequired
            ? "Verifying municipal authority session..."
            : "Verifying Field Worker session..."}
        </p>
      </div>
    );
  }

  if (user && user.role !== requiredRole) {
    const signedInRoleLabel =
      user.role === "authority"
        ? "Municipal Authority"
        : user.role === "worker"
          ? "Field Worker"
          : "Citizen";

    const primaryHref =
      user.role === "authority"
        ? "/admin"
        : user.role === "worker"
          ? "/worker"
          : "/";
    const primaryLabel =
      user.role === "authority"
        ? "Go to Authority Console"
        : user.role === "worker"
          ? "Return to Field Tasks"
          : "Return to Explore Issues";

    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <section
          role="alert"
          className="rounded-2xl border border-[#FECACA] bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#991B1B]">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#991B1B]">
            HTTP 403 • Access Denied
          </p>
          <h1 className="mt-1 font-headline text-2xl font-bold text-[#0F172A]">
            {isAuthorityRequired
              ? "403 Restricted — Municipal Authorities Only"
              : "403 Restricted — Field Workers Only"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            You are currently signed in as{" "}
            <strong>{signedInRoleLabel}</strong> ({user.displayName}).{" "}
            {forbiddenDescription ??
              (isAuthorityRequired
                ? "Municipal dispatch, status updates, completion approvals, and department reassignments are restricted to pre-authorized City Officials."
                : "On-site repair execution and after-repair proof uploads are restricted to pre-authorized Field Crew accounts.")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-lg bg-[#1B365D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002046]"
            >
              {primaryLabel}
            </Link>
            <Link
              href={user.role === "citizen" ? "/my-issues" : "/"}
              className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
            >
              {user.role === "citizen"
                ? "View My Reported Issues"
                : "View Public Feed"}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${
              isAuthorityRequired ? "bg-[#1B365D]" : "bg-[#92400E]"
            }`}
          >
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-bold text-[#0F172A]">
              {isAuthorityRequired
                ? "Municipal Authority Authentication Required"
                : "Field Worker Authentication Required"}
            </h1>
            <p className="text-sm text-[#475569]">
              {authSubtitle ??
                (isAuthorityRequired
                  ? "Official sign-in protects municipal dispatch queues and status updates."
                  : "Sign in with a Field Crew account to execute repairs and upload after-repair proof photos.")}
            </p>
          </div>
        </div>

        {authDescription && (
          <p className="mt-4 text-sm leading-relaxed text-[#334155]">
            {authDescription}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {demoEnabled && (
            <button
              type="button"
              onClick={() =>
                void (isAuthorityRequired
                  ? signInDemoAdmin()
                  : signInDemoWorker())
              }
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${
                isAuthorityRequired
                  ? "bg-[#0F766E] hover:bg-[#115E59]"
                  : "bg-[#92400E] hover:bg-[#78350F]"
              }`}
            >
              {isAuthorityRequired ? (
                <>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Evaluator / Demo Authority Access
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  Demo Field Worker Login
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              openSignInDialog({
                tab: requiredRole,
                mode: "signin",
                returnTo,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1B365D] hover:bg-[#F1F5F9]"
          >
            {isAuthorityRequired
              ? "Official Authority Sign-In"
              : "Official Worker Sign-In"}
          </button>
        </div>
      </section>
    </div>
  );
}
