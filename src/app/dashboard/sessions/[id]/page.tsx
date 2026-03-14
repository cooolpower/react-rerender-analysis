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
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--muted)",
            }}
          >
            {data.url} · {new Date(data.startedAt).toLocaleString()}
          </p>
        </div>

        {/* React Render Heatmap - Client Component with Filter */}
        <RenderHeatmap metrics={data.componentMetrics} />

        {/* API Waterfall */}
        <Section
          title="API Request Waterfall"
          subtitle="API calls sorted by latency"
        >
          {data.apiMetrics.length === 0 ? (
            <EmptyMetric label="No API request data" />
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {data.apiMetrics.map((m: any) => (
                <WaterfallRow
                  key={m.id}
                  endpoint={m.endpoint}
                  method={m.method}
                  statusCode={m.statusCode}
                  latencyMs={m.latencyMs}
                  responseSize={m.responseSize}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </RealtimeDashboard>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
        {title}
      </h2>
      <p
        style={{
          fontSize: "12px",
          color: "var(--muted)",
          marginBottom: "12px",
        }}
      >
        {subtitle}
      </p>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HeatmapRow({
  name,
  renderCount,
  avgTime,
  maxTime,
}: {
  name: string;
  renderCount: number;
  avgTime: number;
  maxTime: number;
}): React.JSX.Element {
  const color =
    renderCount > 15
      ? "var(--danger)"
      : renderCount > 5
        ? "var(--warning)"
        : "var(--success)";

  const maxRenderCount = 20;
  const barWidth = Math.min((renderCount / maxRenderCount) * 100, 100);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr 80px 90px 90px",
        alignItems: "center",
        gap: "12px",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--foreground)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
      <div
        style={{
          background: "var(--surface-alt)",
          borderRadius: "3px",
          height: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            background: color,
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color,
          fontWeight: "600",
          textAlign: "right",
        }}
      >
        ×{renderCount}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--muted)",
          textAlign: "right",
        }}
      >
        avg {avgTime.toFixed(1)}ms
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--muted)",
          textAlign: "right",
        }}
      >
        max {maxTime.toFixed(1)}ms
      </span>
    </div>
  );
}

function WaterfallRow({
  endpoint,
  method,
  statusCode,
  latencyMs,
  responseSize,
}: {
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  responseSize: number;
}): React.JSX.Element {
  const SLOWEST_MS = 2000;
  const barWidth = Math.min((latencyMs / SLOWEST_MS) * 100, 100);
  const latencyColor =
    latencyMs > 500
      ? "var(--danger)"
      : latencyMs > 200
        ? "var(--warning)"
        : "var(--success)";

  const statusColor =
    statusCode >= 500
      ? "var(--danger)"
      : statusCode >= 400
        ? "var(--warning)"
        : "var(--success)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "50px 1fr 1fr 80px 90px",
        alignItems: "center",
        gap: "12px",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: "700",
          color: "var(--primary)",
        }}
      >
        {method}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--foreground)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {endpoint}
      </span>
      <div
        style={{
          background: "var(--surface-alt)",
          borderRadius: "3px",
          height: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            background: latencyColor,
            borderRadius: "3px",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: statusColor,
          fontWeight: "600",
          textAlign: "right",
        }}
      >
        {statusCode}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: latencyColor,
          fontWeight: "600",
          textAlign: "right",
        }}
      >
        {latencyMs}ms
      </span>
    </div>
  );
}

function EmptyMetric({ label }: { label: string }): React.JSX.Element {
  return (
    <p
      style={{
        color: "var(--muted)",
        fontSize: "13px",
        textAlign: "center",
        padding: "20px 0",
      }}
    >
      {label}
    </p>
  );
}
