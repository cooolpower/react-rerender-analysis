"use client";

import React, { useState, useMemo } from "react";
import { RenderHeatmap } from "./render-heatmap";

interface PageVisit {
  id: string;
  url: string;
  path: string;
  startedAt: Date;
}

interface ComponentMetric {
  id: string;
  pageVisitId: string | null;
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
}

interface ApiMetric {
  id: string;
  pageVisitId: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  responseSize: number;
}

interface SessionDetailViewProps {
  pages: PageVisit[];
  componentMetrics: ComponentMetric[];
  apiMetrics: ApiMetric[];
}

export function SessionDetailView({
  pages,
  componentMetrics,
  apiMetrics,
}: SessionDetailViewProps): React.JSX.Element {
  const [selectedPageId, setSelectedPageId] = useState<string>("all");

  const filteredComponentMetrics = useMemo(() => {
    if (selectedPageId === "all") return componentMetrics;
    return componentMetrics.filter((m) => m.pageVisitId === selectedPageId);
  }, [selectedPageId, componentMetrics]);

  const filteredApiMetrics = useMemo(() => {
    if (selectedPageId === "all") return apiMetrics;
    return apiMetrics.filter((m) => m.pageVisitId === selectedPageId);
  }, [selectedPageId, apiMetrics]);

  return (
    <div>
      {/* Timeline Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "32px",
          overflowX: "auto",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <TabButton
          label="All Activity"
          active={selectedPageId === "all"}
          onClick={() => setSelectedPageId("all")}
        />
        {pages.map((p, index) => (
          <TabButton
            key={p.id}
            label={`Step ${index + 1}: ${p.path}`}
            active={selectedPageId === p.id}
            onClick={() => setSelectedPageId(p.id)}
            subtitle={new Date(p.startedAt).toLocaleTimeString()}
          />
        ))}
      </div>

      {/* React Render Heatmap */}
      <RenderHeatmap metrics={filteredComponentMetrics} />

      {/* API Waterfall */}
      <Section
        title="API Request Waterfall"
        subtitle={
          selectedPageId === "all"
            ? "API calls from the entire session"
            : `API calls for ${pages.find((p) => p.id === selectedPageId)?.path}`
        }
      >
        {filteredApiMetrics.length === 0 ? (
          <EmptyMetric label="No API request data for this view" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredApiMetrics.map((m) => (
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
  );
}

function TabButton({
  label,
  subtitle,
  active,
  onClick,
}: {
  label: string;
  subtitle?: string;
  active: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid",
        borderColor: active ? "var(--primary)" : "var(--border)",
        background: active ? "rgba(var(--primary-rgb), 0.1)" : "transparent",
        color: active ? "var(--primary)" : "var(--muted)",
        cursor: "pointer",
        textAlign: "left",
        minWidth: "140px",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: active ? "600" : "500", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {subtitle && (
        <span style={{ fontSize: "11px", opacity: 0.7 }}>{subtitle}</span>
      )}
    </button>
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
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
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
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: "700", color: "var(--primary)" }}>
        {method}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {endpoint}
      </span>
      <div style={{ background: "var(--surface-alt)", borderRadius: "3px", height: "6px", overflow: "hidden" }}>
        <div style={{ width: `${barWidth}%`, height: "100%", background: latencyColor, borderRadius: "3px" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: statusColor, fontWeight: "600", textAlign: "right" }}>
        {statusCode}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: latencyColor, fontWeight: "600", textAlign: "right" }}>
        {latencyMs}ms
      </span>
    </div>
  );
}

function EmptyMetric({ label }: { label: string }): React.JSX.Element {
  return (
    <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
      {label}
    </p>
  );
}
