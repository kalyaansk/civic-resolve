"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function Footer() {
  const { user, openSignInDialog } = useAuth();
  const isAuthority = user?.role === "authority";
  const isWorker = user?.role === "worker";
  const isCitizen = user?.role === "citizen";

  return (
    <footer className="mt-16 border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              © 2026 CivicResolve Municipal Transparency Portal
            </p>
            <p className="mt-0.5 text-xs text-[#475569]">
              Engineered to WCAG 2.1 AA accessibility standards with Gemini AI
              Multimodal Triage and Google Cloud services.
            </p>
          </div>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#475569]"
        >
          <Link href="/" className="hover:text-[#1B365D] hover:underline">
            Track Issues
          </Link>
          {isCitizen && (
            <>
              <Link
                href="/my-issues"
                className="hover:text-[#1B365D] hover:underline"
              >
                My Reported Issues
              </Link>
              <Link
                href="/report"
                className="hover:text-[#1B365D] hover:underline"
              >
                Report an Issue
              </Link>
            </>
          )}
          {isWorker && (
            <Link
              href="/worker"
              className="hover:text-[#1B365D] hover:underline"
            >
              Field Tasks
            </Link>
          )}
          {isAuthority && (
            <Link
              href="/admin"
              className="hover:text-[#1B365D] hover:underline"
            >
              Authority Console
            </Link>
          )}
          {!user && (
            <>
              <button
                type="button"
                onClick={() =>
                  openSignInDialog({
                    tab: "worker",
                    mode: "signin",
                    returnTo: "/worker",
                  })
                }
                className="hover:text-[#1B365D] hover:underline"
              >
                Field Worker Portal
              </button>
              <button
                type="button"
                onClick={() =>
                  openSignInDialog({
                    tab: "authority",
                    mode: "signin",
                    returnTo: "/admin",
                  })
                }
                className="hover:text-[#1B365D] hover:underline"
              >
                Official Authority Sign-In
              </button>
            </>
          )}
          <Link
            href="/api/health"
            className="hover:text-[#1B365D] hover:underline"
          >
            System Health
          </Link>
        </nav>
      </div>
    </footer>
  );
}
