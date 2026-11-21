import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkerTaskDetail } from "@/components/worker/WorkerTaskDetail";
import { getIssueById } from "@/lib/firebase/issuesRepository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Field Task Execution",
};

interface WorkerTaskRouteProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerTaskRoute({
  params,
}: WorkerTaskRouteProps) {
  const { id } = await params;
  const issue = await getIssueById(id);

  if (!issue) {
    notFound();
  }

  return <WorkerTaskDetail initialIssue={issue} />;
}
