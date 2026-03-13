import type { MetricEvent, StorageData } from "../shared/types";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 5000];

interface BackgroundState {
  sessionId: string | null;
  apiKey: string | null;
  backendUrl: string;
  pendingEvents: MetricEvent[];
}

const state: BackgroundState = {
  sessionId: null,
  apiKey: null,
  backendUrl: "http://localhost:3000", // Default, will be overridden by storage
  pendingEvents: [],
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
    "sessionId",
    "backendUrl",
  ]) as StorageData;

  state.apiKey = data.apiKey ?? null;
  state.sessionId = data.sessionId ?? null;
  if (data.backendUrl) {
    state.backendUrl = data.backendUrl;
  }
  
  console.log("[ReactPerf] Storage loaded:", { 
    hasApiKey: !!state.apiKey, 
    sessionId: state.sessionId, 
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

  // Check if we already have a valid session for this URL
  const data = await chrome.storage.local.get(["sessionUrl", "sessionTimestamp", "sessionId"]) as {
    sessionUrl?: string;
    sessionTimestamp?: number;
    sessionId?: string;
  };

  const isSameUrl = data.sessionUrl === normalizedTabUrl;
  const isNotExpired = data.sessionTimestamp && (Date.now() - data.sessionTimestamp < SESSION_EXPIRY_MS);

  if (data.sessionId && isSameUrl && isNotExpired) {
    state.sessionId = data.sessionId;
    console.log(`[ReactPerf] Reusing existing session: ${state.sessionId} for ${normalizedTabUrl}`);
    // Update timestamp to extend session
    await chrome.storage.local.set({ sessionTimestamp: Date.now() });
    return;
  }

  try {
    console.log(`[ReactPerf] Attempting to start NEW session for: ${tabUrl}`);
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
      state.sessionId = json.data.sessionId;
      await chrome.storage.local.set({ 
        sessionId: state.sessionId,
        sessionUrl: normalizedTabUrl,
        sessionTimestamp: Date.now()
      });
      console.log(`[ReactPerf] Session started! ID: ${state.sessionId} for ${normalizedTabUrl}`);
    } else {
      console.error(`[ReactPerf] API returned error starting session: ${json.error}`);
    }
  } catch (err) {
    console.error("[ReactPerf] Error starting session:", err);
  }
}

async function sendMetricsBatch(events: MetricEvent[]): Promise<void> {
  if (!state.sessionId || !state.apiKey || events.length === 0) return;

  await fetchWithRetry(`${state.backendUrl}/api/metrics/batch`, {
    sessionId: state.sessionId,
    events,
  });
}

async function endSession(): Promise<void> {
  if (!state.sessionId || !state.apiKey) return;

  await fetchWithRetry(`${state.backendUrl}/api/session/end`, {
    sessionId: state.sessionId,
  });

  state.sessionId = null;
  await chrome.storage.local.remove("sessionId");
}

chrome.runtime.onMessage.addListener((message: { type: string; payload: unknown }) => {
  void (async () => {
    await ensureStorageLoaded();
    if (message.type === "METRIC_EVENTS") {
      const events = message.payload as MetricEvent[];
      void sendMetricsBatch(events);
    }
  })();
  
  if (message.type === "GET_SESSION_STATUS") {
    return { sessionId: state.sessionId, apiKey: state.apiKey };
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    void (async () => {
      await loadStorage();
      if (isDashboardUrl(tab.url!, state.backendUrl)) {
        console.log(`[ReactPerf] Skipping tab update for dashboard URL: ${tab.url}`);
        return;
      }
      console.log(`[ReactPerf] Tab updated: ${tab.url}, hasApiKey: ${!!state.apiKey}`);
      if (state.apiKey) {
        void startSession(tab.url!);
      } else {
        console.warn("[ReactPerf] Tab complete but API Key is missing. Skipping session start.");
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
