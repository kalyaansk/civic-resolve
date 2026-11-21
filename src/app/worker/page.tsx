import type { Metadata } from "next";
import { WorkerDashboard } from "@/components/worker/WorkerDashboard";
import { listIssues } from "@/lib/firebase/issuesRepository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Field Worker Portal",
};

export default async function WorkerPage() {
  const data = await listIssues({
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
  });

  return <WorkerDashboard initialIssues={data.issues} />;
}
