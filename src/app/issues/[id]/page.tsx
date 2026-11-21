import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { IssueDetailView } from "@/components/issues/IssueDetailView";
import { getIssueById } from "@/lib/firebase/issuesRepository";

export const dynamic = "force-dynamic";

const getCachedIssueById = cache(getIssueById);

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: IssueDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const issue = await getCachedIssueById(id);
  if (!issue) {
    return { title: "Issue Not Found" };
  }
  return {
    title: `Issue #${issue.referenceCode} — ${issue.title}`,
  };
}

export default async function IssueDetailPage({
  params,
}: IssueDetailPageProps) {
  const { id } = await params;
  const issue = await getCachedIssueById(id);

  if (!issue) {
    notFound();
  }

  return <IssueDetailView initialIssue={issue} />;
}
