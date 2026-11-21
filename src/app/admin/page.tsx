import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { listIssues } from "@/lib/firebase/issuesRepository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Operations Console",
};

interface AdminPageProps {
  searchParams: Promise<{
    updated?: string;
    decision?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [data, resolvedParams] = await Promise.all([
    listIssues({
      search: "",
      state: "All",
      city: "All",
      status: "All",
      priority: "All",
      category: "All",
      department: "All",
      mine: false,
      sort: "urgency",
      limit: 50,
    }),
    searchParams,
  ]);

  const updated =
    typeof resolvedParams.updated === "string" && resolvedParams.updated.trim()
      ? resolvedParams.updated.trim()
      : undefined;
  const decision =
    resolvedParams.decision === "approved" ||
    resolvedParams.decision === "rework"
      ? resolvedParams.decision
      : undefined;

  return (
    <AdminConsole
      initialIssues={data.issues}
      initialBanner={updated ? { updated, decision } : null}
    />
  );
}
