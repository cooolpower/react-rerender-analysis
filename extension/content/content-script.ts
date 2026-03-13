import type { MetricEvent, StorageData } from "../shared/types";

// 봇이나 성능 측정을 위해 일정 간격으로 데이터를 버퍼링하여 전송합니다.
const eventBuffer: MetricEvent[] = [];
const BATCH_INTERVAL_MS = 5000;
const MAX_EVENTS_PER_BATCH = 50;

/**
 * 페이지의 Main World에 스크립트를 주입합니다.
 * 컨텐트 스크립트(Isolated World)에서는 REACT_DEVTOOLS_HOOK 등에 접근할 수 없기 때문입니다.
 */
function injectScript(file: string) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(file);
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

/**
 * 메인 월드에서 보낸 postMessage를 수신하여 백그라운드로 전달합니다.
 */
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.source !== "react-perf-detector") {
    return;
  }

  const { type, ...payload } = event.data;
  
  const metricEvent: MetricEvent = {
    type,
    ...payload
  } as MetricEvent;

  enqueueEvent(metricEvent);
});

function enqueueEvent(event: MetricEvent) {
  eventBuffer.push(event);
  if (eventBuffer.length >= MAX_EVENTS_PER_BATCH) {
    flushBuffer();
  }
}

function flushBuffer() {
  if (eventBuffer.length === 0) return;
  
  const events = [...eventBuffer];
  eventBuffer.length = 0;

  chrome.runtime.sendMessage({
    type: "METRIC_EVENTS",
    payload: events
  });
}

// 주기적으로 버퍼 비우기
setInterval(flushBuffer, BATCH_INTERVAL_MS);

/**
 * 초기화 및 스크립트 주입
 */
async function init() {
  console.log("[ReactPerf] Content script loaded, checking configuration...");
  const data = (await chrome.storage.local.get(["apiKey"])) as StorageData;
  
  const currentUrl = window.location.href;
  const backendUrl = data.backendUrl || "http://localhost:3000";
  
  const isDashboard = currentUrl.startsWith(backendUrl) || 
                    currentUrl.includes("localhost:") || // Local Dev
                    currentUrl.includes("react-rerender-analysis.vercel.app");

  if (isDashboard) {
    console.log("[ReactPerf] Dashboard page detected. Skipping detector injection.");
    return;
  }

  if (data.apiKey) {
    console.log("[ReactPerf] API Key found. Initializing detectors...");
    injectScript("react-render-detector.js");
    injectScript("network-interceptor.js");
  } else {
    console.warn("[ReactPerf] No API Key found. Detectors will not be injected. Please set your API Key in the extension popup.");
  }
}

void init();
