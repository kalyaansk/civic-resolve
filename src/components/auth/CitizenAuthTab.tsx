"use client";

import { Mail, UserCheck } from "lucide-react";
import type { FormEvent } from "react";

interface CitizenAuthTabProps {
  demoEnabled: boolean;
  firebaseConfigured: boolean;
  submitting: boolean;
  citizenMode: "signin" | "register";
  onToggleMode: () => void;
  displayName: string;
  onDisplayNameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  onDemoLogin: () => void;
  onGoogleLogin: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function CitizenAuthTab({
  demoEnabled,
  firebaseConfigured,
  submitting,
  citizenMode,
  onToggleMode,
  displayName,
  onDisplayNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onDemoLogin,
  onGoogleLogin,
  onSubmit,
}: CitizenAuthTabProps) {
  return (
    <div className="mt-4 space-y-4">
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
              Test reporting issues, toggling upvotes, and tracking submissions
              on <code>/my-issues</code> immediately.
            </p>
            <button
              type="button"
              onClick={onDemoLogin}
              disabled={submitting}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0369A1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#075985] disabled:opacity-60"
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Demo Citizen Login
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              or sign in or register with email
            </span>
            <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
          </div>
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
          onClick={onToggleMode}
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
            onClick={onGoogleLogin}
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
          >
            Continue with Google (Citizen)
          </button>

          <form onSubmit={onSubmit} className="space-y-3">
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
                  onChange={(e) => onDisplayNameChange(e.target.value)}
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
                onChange={(e) => onEmailChange(e.target.value)}
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
                onChange={(e) => onPasswordChange(e.target.value)}
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
          Firebase Web Auth keys are not configured in this environment. Use
          Demo Citizen Login above.
        </p>
      )}
    </div>
  );
}
