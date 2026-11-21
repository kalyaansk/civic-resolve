"use client";

import { KeyRound, Lock, ShieldCheck, Wrench } from "lucide-react";
import type { FormEvent } from "react";

interface StaffAuthTabProps {
  role: "worker" | "authority";
  demoEnabled: boolean;
  firebaseConfigured: boolean;
  submitting: boolean;
  email: string;
  onEmailChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  onDemoLogin: () => void;
  onGoogleLogin: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function StaffAuthTab({
  role,
  demoEnabled,
  firebaseConfigured,
  submitting,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onDemoLogin,
  onGoogleLogin,
  onSubmit,
}: StaffAuthTabProps) {
  const isWorker = role === "worker";

  return (
    <div className="mt-4 space-y-4">
      {demoEnabled && (
        <>
          <div
            className={`rounded-xl border p-4 ${
              isWorker
                ? "border-[#FDE68A] bg-[#FFFBEB]"
                : "border-[#99EFE5] bg-[#F0FDFA]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  isWorker ? "text-[#92400E]" : "text-[#0F766E]"
                }`}
              >
                {isWorker ? (
                  <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isWorker
                  ? "Evaluator / Demo Field Worker Access"
                  : "Evaluator / Demo Authority Access"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isWorker
                    ? "bg-white text-[#92400E]"
                    : "bg-[#CCFBF1] text-[#0F766E]"
                }`}
              >
                {isWorker ? "Worker RBAC" : "Authority RBAC"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#334155]">
              {isWorker ? (
                <>
                  Signs in as <strong>R. Selvam (Demo Field Worker)</strong> for
                  the <code>/worker</code> crew execution &amp; after-repair AI
                  verification workflow.
                </>
              ) : (
                <>
                  Signs an HMAC-verified <code>HttpOnly</code> session cookie as{" "}
                  <strong>M. Alvarez (Demo Authority)</strong> for the{" "}
                  <code>/admin</code> dispatch &amp; approval workflow.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={onDemoLogin}
              disabled={submitting}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
                isWorker
                  ? "bg-[#92400E] hover:bg-[#78350F]"
                  : "bg-[#0F766E] hover:bg-[#115E59]"
              }`}
            >
              {isWorker ? (
                <>
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  Demo Field Worker Login
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Evaluator / Demo Authority Access
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {isWorker
                ? "or sign in with official worker credentials"
                : "or sign in with official credentials"}
            </span>
            <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
          </div>
        </>
      )}

      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs text-[#334155]">
        <p className="flex items-center gap-1.5 font-bold text-[#0F172A]">
          <Lock className="h-3.5 w-3.5 text-[#1B365D]" aria-hidden="true" />
          {isWorker
            ? "Official Field Worker Access Only"
            : "Official Sign-In Only"}
        </p>
        <p className="mt-1 leading-relaxed text-[#475569]">
          {isWorker ? (
            <>
              Field crew accounts cannot self-register. Crew emails are
              pre-authorized via the <code>WORKER_EMAILS</code> allowlist or
              Firestore role claims.
            </>
          ) : (
            <>
              Municipal Authority accounts cannot self-register. Official access
              is pre-authorized by the City Administrator via the{" "}
              <code>ADMIN_EMAILS</code> allowlist or Firestore role claims.
            </>
          )}
        </p>
      </div>

      {firebaseConfigured && (
        <>
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
          >
            {isWorker
              ? "Official Worker Google Sign-In"
              : "Official Google Sign-In"}
          </button>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label
                htmlFor={`${role}-email`}
                className="block text-xs font-semibold text-[#0F172A]"
              >
                {isWorker ? "Official Worker Email" : "Official Municipal Email"}
              </label>
              <input
                id={`${role}-email`}
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder={
                  isWorker
                    ? "worker@civicresolve.gov"
                    : "official@civicresolve.gov"
                }
                className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor={`${role}-password`}
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Password
              </label>
              <input
                id={`${role}-password`}
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder={
                  isWorker ? "Enter worker password" : "Enter official password"
                }
                className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#002046] disabled:opacity-60"
            >
              {isWorker ? (
                <>
                  <Wrench className="h-4 w-4" aria-hidden="true" />
                  Sign In to Field Worker Portal
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Sign In to Authority Console
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
