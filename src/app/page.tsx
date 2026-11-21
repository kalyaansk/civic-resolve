import { PublicDashboard } from "@/components/dashboard/PublicDashboard";
import { listIssues } from "@/lib/firebase/issuesRepository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await listIssues({
    search: "",
    state: "All",
    city: "All",
    status: "All",
    priority: "All",
    category: "All",
    department: "All",
    mine: false,
    sort: "recent",
    limit: 20,
  });

  return (
    <PublicDashboard initialIssues={data.issues} initialStats={data.stats} />
  );
}
