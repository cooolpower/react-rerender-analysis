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

async function startSession(tabUrl: string): Promise<void> {
  if (!state.apiKey) {
    console.warn("[ReactPerf] Cannot start session: API Key is missing.");
    return;
  }

  try {
    console.log(`[ReactPerf] Attempting to start session for: ${tabUrl}`);
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
      await chrome.storage.local.set({ sessionId: state.sessionId });
      console.log(`[ReactPerf] Session started! ID: ${state.sessionId}`);
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
      await loadStorage(); // 확실히 하기 위해 한 번 더 로드하거나 ensure 호출
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
  void (async () => {
    await ensureStorageLoaded();
    void endSession();
  })();
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
