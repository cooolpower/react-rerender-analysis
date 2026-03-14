import { auth } from "@/lib/next-auth";
import { redirect, notFound } from "next/navigation";
import { getSessionDetail } from "@/services/sessionService";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Session Detail | ReactPerf" };

import { RealtimeDashboard } from "../../realtime-dashboard";
import { RenderHeatmap } from "./render-heatmap";

import { SessionDetailView } from "./session-detail-view";

export default async function SessionDetailPage({
  params,
}: SessionPageProps): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const data = await getSessionDetail(id, session.user.id);
  if (!data) {
    console.error(
      `[ReactPerf] Session not found. ID: ${id}, UserID: ${session.user.id}`,
    );
    notFound();
  }

  return (
    <RealtimeDashboard>
      <div style={{ padding: "32px" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <a
            href="/dashboard"
            style={{
              color: "var(--muted)",
              fontSize: "12px",
              marginBottom: "8px",
              display: "inline-block",
            }}
          >
            ← Back to sessions
          </a>
          <h1
            style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}
          >
            Session Detail
          </h1>
          <p
            suppressHydrationWarning
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--muted)",
            }}
          >
            {data.origin} · {new Date(data.startedAt).toLocaleString()}
          </p>
        </div>

        {/* Timeline View (Tabs + Metrics) */}
        <SessionDetailView 
          pages={data.pageVisits}
          componentMetrics={data.componentMetrics}
          apiMetrics={data.apiMetrics}
        />
      </div>
    </RealtimeDashboard>
  );
}

