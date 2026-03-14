import type { MetricEvent, StorageData } from "../shared/types";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 5000];

interface BackgroundState {
  apiKey: string | null;
  backendUrl: string;
  pendingEvents: MetricEvent[];
  // Map normalized URL to session ID for multi-tab support
  urlSessionMap: Record<string, string>;
}

const state: BackgroundState = {
  apiKey: null,
  backendUrl: "http://localhost:3000",
  pendingEvents: [],
  urlSessionMap: {},
};

let isStorageLoaded = false;
const storageWaiters: (() => void)[] = [];

async function ensureStorageLoaded(): Promise<void> {
  if (isStorageLoaded) return;
  return new Promise((resolve) => {
    storageWaiters.push(resolve);
  });
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove query params and hash for session matching
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function isDashboardUrl(url: string, backendUrl: string): boolean {
  if (!url) return false;
  try {
    const target = new URL(url);
    const backend = new URL(backendUrl);
    
    // Exact origin match for dashboard
    if (target.origin === backend.origin) return true;
    
    // Fallback for localhost development with different ports if needed
    if (target.hostname === "localhost" && backend.hostname === "localhost") {
       // Optional: only block the specific dashboard app
       // return target.port === backend.port;
    }

    return url.includes("react-rerender-analysis.vercel.app") || 
           url.startsWith("chrome://");
  } catch {
    return url.startsWith("chrome://");
  }
}

async function loadStorage(): Promise<void> {
  const data = await chrome.storage.local.get([
    "apiKey",
    "urlSessionMap",
    "backendUrl",
  ]) as StorageData & { urlSessionMap?: Record<string, string> };

  state.apiKey = data.apiKey ?? null;
  state.urlSessionMap = data.urlSessionMap ?? {};
  if (data.backendUrl) {
    state.backendUrl = data.backendUrl;
  }
  
  console.log("[ReactPerf] Storage loaded:", { 
    hasApiKey: !!state.apiKey, 
    sessions: Object.keys(state.urlSessionMap).length, 
    backendUrl: state.backendUrl 
  });

  isStorageLoaded = true;
  storageWaiters.forEach(resolve => resolve());
  storageWaiters.length = 0;
}

async function fetchWithRetry(
  url: string,
  body: unknown,
  retries = 0
): Promise<void> {
  if (!state.apiKey) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[ReactPerf] Fetch failed: ${res.status} ${res.statusText}`, url);
      if (retries < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[retries] ?? 5000;
        await new Promise((r) => setTimeout(r, delay));
        await fetchWithRetry(url, body, retries + 1);
      }
    }
  } catch (err) {
    console.error(`[ReactPerf] Network error during fetch:`, err, url);
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAYS_MS[retries] ?? 5000;
      await new Promise((r) => setTimeout(r, delay));
      await fetchWithRetry(url, body, retries + 1);
    }
  }
}

const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// injectDetector는 더 이상 필요하지 않음 (manifest.json에서 자동 주입)

async function startSession(tabUrl: string): Promise<void> {
  if (!state.apiKey) {
    console.warn("[ReactPerf] Cannot start session: API Key is missing.");
    return;
  }

  const normalizedTabUrl = normalizeUrl(tabUrl);

  if (isDashboardUrl(tabUrl, state.backendUrl)) {
    console.log(`[ReactPerf] Skipping session start for dashboard URL: ${tabUrl}`);
    return;
  }

  try {
    console.log(`[ReactPerf] Starting NEW session for: ${tabUrl} (Refresh detected)`);
    const res = await fetch(`${state.backendUrl}/api/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify({ url: tabUrl, timestamp: Date.now() }),
    });

    if (!res.ok) {
      console.error(`[ReactPerf] Failed to start session: ${res.status} ${res.statusText}`);
      return;
    }

    const json = (await res.json()) as { success: boolean; data: { sessionId: string }; error?: string };
    if (json.success) {
      const newSessionId = json.data.sessionId;
      state.urlSessionMap[normalizedTabUrl] = newSessionId;
      
      await chrome.storage.local.set({ 
        urlSessionMap: state.urlSessionMap,
        sessionTimestamp: Date.now()
      });
      console.log(`[ReactPerf] Session started! ID: ${newSessionId} for ${normalizedTabUrl}`);
    } else {
      console.error(`[ReactPerf] API returned error starting session: ${json.error}`);
    }
  } catch (err) {
    console.error("[ReactPerf] Error starting session:", err);
  }
}

async function sendMetricsBatch(events: MetricEvent[], sessionId: string): Promise<void> {
  if (!sessionId || !state.apiKey || events.length === 0) return;

  await fetchWithRetry(`${state.backendUrl}/api/metrics/batch`, {
    sessionId,
    events,
  });
}

async function endSession(tabUrl: string): Promise<void> {
  const normalized = normalizeUrl(tabUrl);
  const sessionId = state.urlSessionMap[normalized];
  if (!sessionId || !state.apiKey) return;

  await fetchWithRetry(`${state.backendUrl}/api/session/end`, {
    sessionId,
  });

  delete state.urlSessionMap[normalized];
  await chrome.storage.local.set({ urlSessionMap: state.urlSessionMap });
}

chrome.runtime.onMessage.addListener((message: { type: string; payload: unknown }, sender) => {
  void (async () => {
    await ensureStorageLoaded();
    if (message.type === "METRIC_EVENTS") {
      const events = message.payload as MetricEvent[];
      const url = sender.tab?.url;
      if (url) {
        const normalized = normalizeUrl(url);
        const sessionId = state.urlSessionMap[normalized];
        if (sessionId) {
          void sendMetricsBatch(events, sessionId);
        } else {
          console.warn(`[ReactPerf] No session found for metrics from ${normalized}`);
        }
      }
    }
  })();
  
  if (message.type === "GET_SESSION_STATUS") {
    const url = sender.tab?.url;
    const normalized = url ? normalizeUrl(url) : null;
    const sessionId = normalized ? state.urlSessionMap[normalized] : null;
    return { sessionId, apiKey: state.apiKey };
  }
});

// 페이지 로드 시작 시점에 가장 빨리 주입
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // 메인 프레임만 우선 처리 (필요시 상세 조정)

  void (async () => {
    await loadStorage();
    if (isDashboardUrl(details.url, state.backendUrl)) return;

    if (state.apiKey) {
      console.log(`[ReactPerf] Navigation committed: ${details.url}. Starting session.`);
      await startSession(details.url);
    }
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 컴플리트 시점에도 혹시 누락되었을 경우를 대비해 보조적으로 유지
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    void (async () => {
      await loadStorage();
      if (isDashboardUrl(tab.url!, state.backendUrl)) return;
      
      // 세션 시작 확인용으로만 유지 (필요 시)
      if (state.apiKey && !state.urlSessionMap[normalizeUrl(tab.url!)]) {
        await startSession(tab.url!);
      }
    })();
  }
});

chrome.tabs.onRemoved.addListener(() => {
  // We don't end session immediately on tab close to allow re-opening/refreshing persistence
  // Session will be managed by SESSION_EXPIRY_MS
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) {
    state.apiKey = (changes.apiKey.newValue as string | undefined) ?? null;
    console.log("[ReactPerf] API Key updated in storage.");
  }
  if (changes.backendUrl) {
    state.backendUrl = (changes.backendUrl.newValue as string | undefined) ?? "http://localhost:3000";
    console.log("[ReactPerf] Backend URL updated in storage:", state.backendUrl);
  }
});

void loadStorage();
