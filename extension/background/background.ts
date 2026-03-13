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
  backendUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  pendingEvents: [],
};

async function loadStorage(): Promise<void> {
  const data = await chrome.storage.local.get([
    "apiKey",
    "sessionId",
    "backendUrl",
  ]) as StorageData;

  state.apiKey = data.apiKey ?? null;
  state.sessionId = data.sessionId ?? null;
  if (data.backendUrl) state.backendUrl = data.backendUrl;
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
  } catch {
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAYS_MS[retries] ?? 5000;
      await new Promise((r) => setTimeout(r, delay));
      await fetchWithRetry(url, body, retries + 1);
    }
  }
}

async function startSession(tabUrl: string): Promise<void> {
  if (!state.apiKey) return;

  try {
    const res = await fetch(`${state.backendUrl}/api/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify({ url: tabUrl, timestamp: Date.now() }),
    });

    const json = (await res.json()) as { success: boolean; data: { sessionId: string } };
    if (json.success) {
      state.sessionId = json.data.sessionId;
      await chrome.storage.local.set({ sessionId: state.sessionId });
    }
  } catch {
    // silent fail, metrics will be dropped
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
  if (message.type === "METRIC_EVENTS") {
    const events = message.payload as MetricEvent[];
    void sendMetricsBatch(events);
  }

  if (message.type === "GET_SESSION_STATUS") {
    return { sessionId: state.sessionId, apiKey: state.apiKey };
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http") && state.apiKey) {
    void startSession(tab.url);
  }
});

chrome.tabs.onRemoved.addListener(() => {
  void endSession();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) {
    state.apiKey = (changes.apiKey.newValue as string | undefined) ?? null;
  }
});

void loadStorage();
