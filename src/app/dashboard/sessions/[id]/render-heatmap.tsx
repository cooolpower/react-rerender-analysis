"use client";

import { useState } from "react";

interface ComponentMetric {
  id: string;
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
}

interface RenderHeatmapProps {
  metrics: ComponentMetric[];
}

const LAYOUT_NOISE_NAMES = [
  "div", "span", "p", "img", "a", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6",
  "Flex", "Box", "Stack", "Grid", "Container", "Section", "Main", "Header", "Footer",
  "Anonymous", "Unknown", "Anonymous Component"
];

export function RenderHeatmap({ metrics }: RenderHeatmapProps): React.JSX.Element {
  const [hideNoise, setHideNoise] = useState(true);

  const filteredMetrics = hideNoise
    ? metrics.filter(m => !LAYOUT_NOISE_NAMES.some(noise => 
        m.componentName.toLowerCase() === noise.toLowerCase()
      ))
    : metrics;

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-end",
        marginBottom: "12px" 
      }}>
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
            React Render Heatmap
          </h2>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>
            Components sorted by render count
          </p>
        </div>
        
        <label style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          fontSize: "12px", 
          cursor: "pointer",
          background: "var(--surface-alt)",
          padding: "6px 10px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          userSelect: "none"
        }}>
          <input 
            type="checkbox" 
            checked={hideNoise}
            onChange={(e) => setHideNoise(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <span style={{ color: hideNoise ? "var(--primary)" : "var(--muted)" }}>
            Hide Layout Noise
          </span>
        </label>
      </div>

      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
      }}>
        {filteredMetrics.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            {metrics.length > 0 ? "No business components found. Try toggling 'Hide Layout Noise'." : "No component render data"}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredMetrics.map((m) => (
              <HeatmapRow
                key={m.id}
                name={m.componentName}
                renderCount={m.renderCount}
                avgTime={m.averageRenderTime}
                maxTime={m.maxRenderTime}
              />
            ))}
          </div>
        )}
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

  const maxRenderCount = Math.max(20, renderCount); // 동적 scale 조절
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
        ×{renderCount.toLocaleString()}
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
