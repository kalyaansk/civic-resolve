import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ReportIssueForm } from "@/components/report/ReportIssueForm";

export const metadata: Metadata = {
  title: "Report a Civic Issue",
};

export default function ReportIssuePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
        <Link href="/" className="hover:text-[#1B365D] hover:underline">
          Track Issues
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
        <span className="font-semibold text-[#0F172A]">Report an Issue</span>
      </nav>

      <div className="mt-3">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-[#0F172A]">
          Report a Civic Issue
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[#475569]">
          Provide incident details, pin the street location, and optionally
          attach 1 photo (up to 5 MB). Gemini AI automatically assesses urgency
          and routes your report to the responsible municipal department.
        </p>
      </div>

      <ReportIssueForm />
    </div>
  );
}
