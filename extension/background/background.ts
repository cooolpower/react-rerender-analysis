import type { MetricEvent, StorageData } from "../shared/types";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 5000];

interface BackgroundState {
  apiKey: string | null;
  backendUrl: string;
  pendingEvents: MetricEvent[];
  // Map origin to session ID
  originSessionMap: Record<string, string>;
  // Map URL to page visit ID
  urlPageVisitMap: Record<string, string>;
}

const state: BackgroundState = {
  apiKey: null,
  backendUrl: "http://localhost:3000",
  pendingEvents: [],
  originSessionMap: {},
  urlPageVisitMap: {},
};

let isStorageLoaded = false;
const storageWaiters: (() => void)[] = [];

async function ensureStorageLoaded(): Promise<void> {
  if (isStorageLoaded) return;
  return new Promise((resolve) => {
    storageWaiters.push(resolve);
  });
}

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function isDashboardUrl(url: string, backendUrl: string): boolean {
  if (!url) return false;
  try {
    const target = new URL(url);
    const backend = new URL(backendUrl);
    if (target.origin === backend.origin) return true;
    return url.includes("react-rerender-analysis.vercel.app") || 
           url.startsWith("chrome://");
  } catch {
    return url.startsWith("chrome://");
  }
}

async function loadStorage(): Promise<void> {
  const data = await chrome.storage.local.get([
    "apiKey",
    "originSessionMap",
    "urlPageVisitMap",
    "backendUrl",
  ]) as StorageData & { 
    originSessionMap?: Record<string, string>;
    urlPageVisitMap?: Record<string, string>;
  };

  state.apiKey = data.apiKey ?? null;
  state.originSessionMap = data.originSessionMap ?? {};
  state.urlPageVisitMap = data.urlPageVisitMap ?? {};
  if (data.backendUrl) {
    state.backendUrl = data.backendUrl;
  }
  
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

    if (!res.ok && retries < MAX_RETRIES) {
      const delay = RETRY_DELAYS_MS[retries] ?? 5000;
      await new Promise((r) => setTimeout(r, delay));
      await fetchWithRetry(url, body, retries + 1);
    }
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAYS_MS[retries] ?? 5000;
      await new Promise((r) => setTimeout(r, delay));
      await fetchWithRetry(url, body, retries + 1);
    }
  }
}

async function ensureSessionAndPage(tabUrl: string): Promise<{ sessionId: string; pageVisitId: string } | null> {
  if (!state.apiKey) return null;
  if (isDashboardUrl(tabUrl, state.backendUrl)) return null;

  const origin = getOrigin(tabUrl);
  const normalizedUrl = normalizeUrl(tabUrl);
  let sessionId = state.originSessionMap[origin];

  // 1. Session check/create
  if (!sessionId) {
    console.log(`[ReactPerf] Starting NEW session for origin: ${origin}`);
    try {
      const res = await fetch(`${state.backendUrl}/api/session/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.apiKey}`,
        },
        body: JSON.stringify({ origin, userAgent: navigator.userAgent }),
      });

      if (res.ok) {
        const json = await res.json();
        sessionId = json.data.sessionId;
        state.originSessionMap[origin] = sessionId;
      }
    } catch (err) {
      console.error("[ReactPerf] Error starting session:", err);
      return null;
    }
  }

  // 2. Page Visit check/create
  // URL이 달라지면 무조건 새로운 PageVisit 생성
  console.log(`[ReactPerf] Tracking page visit for: ${tabUrl}`);
  try {
    const res = await fetch(`${state.backendUrl}/api/session/page`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify({ sessionId, url: tabUrl }),
    });

    if (res.ok) {
      const json = await res.json();
      const pageVisitId = json.data.pageVisitId;
      state.urlPageVisitMap[normalizedUrl] = pageVisitId;
      
      await chrome.storage.local.set({ 
        originSessionMap: state.originSessionMap,
        urlPageVisitMap: state.urlPageVisitMap
      });

      return { sessionId, pageVisitId };
    }
  } catch (err) {
    console.error("[ReactPerf] Error tracking page visit:", err);
  }

  return null;
}

async function sendMetricsBatch(events: MetricEvent[], sessionId: string, pageVisitId?: string): Promise<void> {
  if (!sessionId || !state.apiKey || events.length === 0) return;

  await fetchWithRetry(`${state.backendUrl}/api/metrics/batch`, {
    sessionId,
    pageVisitId,
    events,
  });
}

chrome.runtime.onMessage.addListener((message: { type: string; payload: unknown }, sender) => {
  void (async () => {
    await ensureStorageLoaded();
    if (message.type === "METRIC_EVENTS") {
      const events = message.payload as MetricEvent[];
      const url = sender.tab?.url;
      if (url) {
        const origin = getOrigin(url);
        const normalized = normalizeUrl(url);
        const sessionId = state.originSessionMap[origin];
        const pageVisitId = state.urlPageVisitMap[normalized];
        
        if (sessionId) {
          void sendMetricsBatch(events, sessionId, pageVisitId);
        }
      }
    }
  })();
  
  if (message.type === "GET_SESSION_STATUS") {
    const url = sender.tab?.url;
    const origin = url ? getOrigin(url) : null;
    const normalized = url ? normalizeUrl(url) : null;
    const sessionId = origin ? state.originSessionMap[origin] : null;
    const pageVisitId = normalized ? state.urlPageVisitMap[normalized] : null;
    return { sessionId, pageVisitId, apiKey: state.apiKey };
  }
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;

  void (async () => {
    await loadStorage();
    if (state.apiKey) {
      await ensureSessionAndPage(details.url);
    }
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    void (async () => {
      await loadStorage();
      const normalized = normalizeUrl(tab.url!);
      if (state.apiKey && !state.urlPageVisitMap[normalized]) {
        await ensureSessionAndPage(tab.url!);
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
