"use client";

import {
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  UserCheck,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut, openSignInDialog } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isFeedActive = pathname === "/" || pathname.startsWith("/issues");
  const isMyIssuesActive = pathname.startsWith("/my-issues");
  const isReportActive = pathname.startsWith("/report");
  const isWorkerActive = pathname.startsWith("/worker");
  const isAdminActive = pathname.startsWith("/admin");

  const isAuthority = user?.role === "authority";
  const isWorker = user?.role === "worker";
  const isCitizen = user?.role === "citizen";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg py-1 pr-1 text-[#1B365D] transition-opacity hover:opacity-90"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path
                d="M18 3L5 8.5V17.5C5 25.3 10.55 32.4 18 34C25.45 32.4 31 25.3 31 17.5V8.5L18 3Z"
                fill="#1B365D"
              />
              <path
                d="M18 9.5C14.69 9.5 12 12.19 12 15.5C12 20 18 26.5 18 26.5C18 26.5 24 20 24 15.5C24 12.19 21.31 9.5 18 9.5Z"
                fill="#0F766E"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle cx="18" cy="15.5" r="2.5" fill="#FFFFFF" />
            </svg>
            <span className="font-headline text-xl font-bold tracking-tight text-[#1B365D]">
              CivicResolve
            </span>
          </Link>

          <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-[#99EFE5] bg-[#F0FDFA] px-2.5 py-0.5 text-xs font-semibold text-[#0F766E]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#0F766E]"
              aria-hidden="true"
            />
            Civic Pulse Live
          </span>

          {/* Strict Role-Based Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-1"
          >
            {!user && (
              <Link
                href="/"
                aria-current={isFeedActive ? "page" : undefined}
                className={cn(
                  "flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                  isFeedActive
                    ? "border-[#1B365D] text-[#1B365D]"
                    : "border-transparent text-[#475569] hover:text-[#0F172A]",
                )}
              >
                Track Issues
              </Link>
            )}

            {isCitizen && (
              <>
                <Link
                  href="/"
                  aria-current={isFeedActive ? "page" : undefined}
                  className={cn(
                    "flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                    isFeedActive
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-[#475569] hover:text-[#0F172A]",
                  )}
                >
                  Explore Issues
                </Link>
                <Link
                  href="/my-issues"
                  aria-current={isMyIssuesActive ? "page" : undefined}
                  className={cn(
                    "flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                    isMyIssuesActive
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-[#475569] hover:text-[#0F172A]",
                  )}
                >
                  My Reported Issues
                </Link>
              </>
            )}

            {isWorker && (
              <>
                <Link
                  href="/worker"
                  aria-current={isWorkerActive ? "page" : undefined}
                  className={cn(
                    "flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                    isWorkerActive
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-[#475569] hover:text-[#0F172A]",
                  )}
                >
                  Field Tasks
                </Link>
                <Link
                  href="/"
                  aria-current={isFeedActive ? "page" : undefined}
                  className={cn(
                    "flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                    isFeedActive
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-[#475569] hover:text-[#0F172A]",
                  )}
                >
                  Public Feed
                </Link>
              </>
            )}

            {isAuthority && (
              <>
                <Link
                  href="/admin"
                  aria-current={isAdminActive ? "page" : undefined}
                  className={cn(
                    "flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                    isAdminActive
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-[#475569] hover:text-[#0F172A]",
                  )}
                >
                  Authority Console
                </Link>
                <Link
                  href="/"
                  aria-current={isFeedActive ? "page" : undefined}
                  className={cn(
                    "flex h-16 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                    isFeedActive
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-[#475569] hover:text-[#0F172A]",
                  )}
                >
                  Public Feed
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {!user && (
            <>
              <button
                type="button"
                onClick={() =>
                  openSignInDialog({
                    tab: "citizen",
                    mode: "signin",
                    returnTo: "/report",
                    message:
                      "Sign in as a Citizen to report an issue (demo login takes 1 click).",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#002046]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Report an Issue
              </button>
              <button
                type="button"
                onClick={() =>
                  openSignInDialog({
                    tab: "worker",
                    mode: "signin",
                    returnTo: "/worker",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-sm font-semibold text-[#1B365D] transition-colors hover:bg-[#F1F5F9]"
              >
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                Field Worker
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-sm font-semibold text-[#1B365D] transition-colors hover:bg-[#F1F5F9]"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Authority
              </button>
            </>
          )}

          {isCitizen && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Citizen</span>
              </span>
              <Link
                href="/report"
                aria-current={isReportActive ? "page" : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#002046]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Report an Issue
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </>
          )}

          {isWorker && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-xs font-semibold text-[#92400E]">
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Field Worker</span>
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </>
          )}

          {isAuthority && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#99EFE5] bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0F766E]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Authority</span>
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </>
          )}
        </div>

        {/* Mobile Header Actions */}
        <div className="flex md:hidden items-center gap-2">
          {!user && (
            <button
              type="button"
              onClick={() =>
                openSignInDialog({
                  tab: "citizen",
                  mode: "signin",
                  returnTo: "/report",
                })
              }
              className="inline-flex items-center gap-1 rounded-lg bg-[#1B365D] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Report
            </button>
          )}
          {isCitizen && (
            <Link
              href="/report"
              className="inline-flex items-center gap-1 rounded-lg bg-[#1B365D] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Report
            </Link>
          )}
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-nav-panel"
          aria-label="Mobile navigation"
          className="border-t border-[#E2E8F0] bg-white px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1.5">
            {!user && (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isFeedActive
                      ? "bg-[#EFF6FF] text-[#1B365D]"
                      : "text-[#475569] hover:bg-[#F8FAFC]",
                  )}
                >
                  Track Issues
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSignInDialog({
                      tab: "citizen",
                      mode: "signin",
                      returnTo: "/report",
                    });
                  }}
                  className="rounded-lg bg-[#1B365D] px-3 py-2 text-left text-sm font-semibold text-white"
                >
                  + Report an Issue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSignInDialog({
                      tab: "worker",
                      mode: "signin",
                      returnTo: "/worker",
                    });
                  }}
                  className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-left text-sm font-semibold text-[#1B365D] hover:bg-[#F8FAFC]"
                >
                  Field Worker
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSignInDialog({
                      tab: "authority",
                      mode: "signin",
                      returnTo: "/admin",
                    });
                  }}
                  className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-left text-sm font-semibold text-[#1B365D] hover:bg-[#F8FAFC]"
                >
                  Authority
                </button>
              </>
            )}

            {isCitizen && (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isFeedActive
                      ? "bg-[#EFF6FF] text-[#1B365D]"
                      : "text-[#475569] hover:bg-[#F8FAFC]",
                  )}
                >
                  Explore Issues
                </Link>
                <Link
                  href="/my-issues"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isMyIssuesActive
                      ? "bg-[#EFF6FF] text-[#1B365D]"
                      : "text-[#475569] hover:bg-[#F8FAFC]",
                  )}
                >
                  My Reported Issues
                </Link>
                <Link
                  href="/report"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  + Report an Issue
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void signOut();
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-lg border-t border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#991B1B]"
                >
                  <span>Sign Out ({user.displayName})</span>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}

            {isWorker && (
              <>
                <Link
                  href="/worker"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isWorkerActive
                      ? "bg-[#EFF6FF] text-[#1B365D]"
                      : "text-[#475569] hover:bg-[#F8FAFC]",
                  )}
                >
                  Field Tasks
                </Link>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isFeedActive
                      ? "bg-[#EFF6FF] text-[#1B365D]"
                      : "text-[#475569] hover:bg-[#F8FAFC]",
                  )}
                >
                  Public Feed
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void signOut();
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-lg border-t border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#991B1B]"
                >
                  <span>Sign Out ({user.displayName})</span>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}

            {isAuthority && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isAdminActive
                      ? "bg-[#EFF6FF] text-[#1B365D]"
                      : "text-[#475569] hover:bg-[#F8FAFC]",
                  )}
                >
                  Authority Console
                </Link>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    isFeedActive
                      ? "bg-[#EFF6FF] text-[#1B365D]"
                      : "text-[#475569] hover:bg-[#F8FAFC]",
                  )}
                >
                  Public Feed
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void signOut();
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-lg border-t border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#991B1B]"
                >
                  <span>Sign Out ({user.displayName})</span>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
