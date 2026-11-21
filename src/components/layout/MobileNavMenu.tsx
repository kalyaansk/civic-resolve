"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import type { OpenSignInOptions } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/issue";

interface MobileNavMenuProps {
  user: UserProfile | null;
  isFeedActive: boolean;
  isMyIssuesActive: boolean;
  isWorkerActive: boolean;
  isAdminActive: boolean;
  onClose: () => void;
  onOpenSignIn: (options: OpenSignInOptions) => void;
  onSignOut: () => void;
}

export function MobileNavMenu({
  user,
  isFeedActive,
  isMyIssuesActive,
  isWorkerActive,
  isAdminActive,
  onClose,
  onOpenSignIn,
  onSignOut,
}: MobileNavMenuProps) {
  const isAuthority = user?.role === "authority";
  const isWorker = user?.role === "worker";
  const isCitizen = user?.role === "citizen";

  return (
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
              onClick={onClose}
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
                onClose();
                onOpenSignIn({
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
                onClose();
                onOpenSignIn({
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
                onClose();
                onOpenSignIn({
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
            >
              + Report an Issue
            </Link>
          </>
        )}

        {isWorker && (
          <>
            <Link
              href="/worker"
              onClick={onClose}
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
              onClick={onClose}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold",
                isFeedActive
                  ? "bg-[#EFF6FF] text-[#1B365D]"
                  : "text-[#475569] hover:bg-[#F8FAFC]",
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
              onClick={onClose}
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
              onClick={onClose}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold",
                isFeedActive
                  ? "bg-[#EFF6FF] text-[#1B365D]"
                  : "text-[#475569] hover:bg-[#F8FAFC]",
              )}
            >
              Public Feed
            </Link>
          </>
        )}

        {user && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="mt-1 flex w-full items-center justify-between rounded-lg border-t border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#991B1B]"
          >
            <span>Sign Out ({user.displayName})</span>
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
}
