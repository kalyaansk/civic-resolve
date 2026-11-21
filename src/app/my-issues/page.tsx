import type { Metadata } from "next";
import { MyIssuesView } from "@/components/issues/MyIssuesView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Reported Issues",
};

export default function MyIssuesPage() {
  return <MyIssuesView />;
}
