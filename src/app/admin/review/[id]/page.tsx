import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorityReviewPage } from "@/components/admin/AuthorityReviewPage";
import { getIssueById, listIssues } from "@/lib/firebase/issuesRepository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authority Completion Review",
};

interface AdminReviewRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReviewRoute({
  params,
}: AdminReviewRouteProps) {
  const { id } = await params;

  const [issue, pendingData] = await Promise.all([
    getIssueById(id),
    listIssues({
      search: "",
      state: "All",
      city: "All",
      status: "Pending Verification",
      priority: "All",
      category: "All",
      department: "All",
      mine: false,
      sort: "urgency",
      limit: 50,
    }),
  ]);

  if (!issue) {
    notFound();
  }

  const pendingIds = pendingData.issues.map((item) => item.id);

  return <AuthorityReviewPage initialIssue={issue} pendingIds={pendingIds} />;
}
