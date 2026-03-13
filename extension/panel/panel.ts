type MetricEvent =
  | {
      type: "component_render";
      componentName: string;
      renderTime: number;
      timestamp: number;
    }
  | {
      type: "api_request";
      endpoint: string;
      method: string;
      statusCode: number;
      latency: number;
      responseSize: number;
      timestamp: number;
    };

interface RenderStats {
  count: number;
  totalTime: number;
  maxTime: number;
}

const renderMap = new Map<string, RenderStats>();
const apiEvents: Extract<MetricEvent, { type: "api_request" }>[] = [];

const MAX_API_ROWS = 100;
const SLOWEST_MS = 2000;
const MAX_RENDER_COUNT = 20;

function getHeatColor(count: number): string {
  if (count > 15) return "#ef4444";
  if (count > 5) return "#f59e0b";
  return "#22c55e";
}

function getLatencyColor(ms: number): string {
  if (ms > 500) return "#ef4444";
  if (ms > 200) return "#f59e0b";
  return "#22c55e";
}

function getStatusColor(code: number): string {
  if (code >= 500) return "#ef4444";
  if (code >= 400) return "#f59e0b";
  return "#22c55e";
}

function renderHeatmap(): void {
  const container = document.getElementById("render-rows") as HTMLElement;
  const empty = document.getElementById("empty") as HTMLElement;

  if (renderMap.size === 0) {
    empty.style.display = "block";
    container.innerHTML = "";
    return;
  }

  empty.style.display = "none";

  const sorted = [...renderMap.entries()].sort((a, b) => b[1].count - a[1].count);

  container.innerHTML = sorted
    .map(([name, stats]) => {
      const color = getHeatColor(stats.count);
      const barW = Math.min((stats.count / MAX_RENDER_COUNT) * 100, 100);
      const avg = (stats.totalTime / stats.count).toFixed(1);
      const max = stats.maxTime.toFixed(1);

      return `
        <div class="row row-render">
          <span class="name" title="${name}">${name}</span>
          <div class="bar-wrap"><div class="bar" style="width:${barW}%;background:${color}"></div></div>
          <span class="mono" style="color:${color}">×${stats.count}</span>
          <span class="mono muted">avg ${avg}ms</span>
        </div>`;
    })
    .join("");
}

function renderApiWaterfall(): void {
  const container = document.getElementById("api-rows") as HTMLElement;
  if (!container) return;

  container.innerHTML = apiEvents
    .map((e) => {
      const latencyColor = getLatencyColor(e.latency);
      const statusColor = getStatusColor(e.statusCode);
      const barW = Math.min((e.latency / SLOWEST_MS) * 100, 100);

      return `
        <div class="row row-api">
          <span class="mono blue">${e.method}</span>
          <span class="name" title="${e.endpoint}">${e.endpoint}</span>
          <div class="bar-wrap"><div class="bar" style="width:${barW}%;background:${latencyColor}"></div></div>
          <span class="mono" style="color:${statusColor}">${e.statusCode}</span>
          <span class="mono" style="color:${latencyColor}">${e.latency}ms</span>
        </div>`;
    })
    .join("");
}

function processEvent(event: MetricEvent): void {
  if (event.type === "component_render") {
    const existing = renderMap.get(event.componentName);
    if (existing) {
      existing.count += 1;
      existing.totalTime += event.renderTime;
      existing.maxTime = Math.max(existing.maxTime, event.renderTime);
    } else {
      renderMap.set(event.componentName, {
        count: 1,
        totalTime: event.renderTime,
        maxTime: event.renderTime,
      });
    }
    renderHeatmap();
  }

  if (event.type === "api_request") {
    apiEvents.unshift(event);
    if (apiEvents.length > MAX_API_ROWS) apiEvents.pop();
    renderApiWaterfall();
  }
}

// API Key form
const apiKeyForm = document.getElementById("api-key-form") as HTMLElement;
const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement;
const apiKeySave = document.getElementById("api-key-save") as HTMLButtonElement;
const statusBadge = document.getElementById("status-badge") as HTMLElement;

chrome.storage.local.get(["apiKey"], (data: { apiKey?: string }) => {
  if (data.apiKey) {
    apiKeyForm.style.display = "none";
    apiKeyInput.value = data.apiKey;
    statusBadge.textContent = "LIVE";
    statusBadge.className = "badge badge-live";
  }
});

apiKeySave.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;
  chrome.storage.local.set({ apiKey: key }, () => {
    apiKeyForm.style.display = "none";
    statusBadge.textContent = "LIVE";
    statusBadge.className = "badge badge-live";
  });
});

// Tabs
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const target = (tab as HTMLElement).dataset.tab;
    (document.getElementById("panel-renders") as HTMLElement).style.display =
      target === "renders" ? "block" : "none";
    (document.getElementById("panel-api") as HTMLElement).style.display =
      target === "api" ? "block" : "none";
  });
});

// Listen for metrics from background
chrome.runtime.onMessage.addListener((message: { type: string; payload: MetricEvent[] }) => {
  if (message.type === "METRIC_EVENTS") {
    message.payload.forEach(processEvent);
  }
});
