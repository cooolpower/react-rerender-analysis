/**
 * NetworkInterceptor
 * 
 * fetch 및 XMLHttpRequest를 가로채어 API 지연 시간을 측정합니다.
 */

(function () {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const start = performance.now();
    try {
      const response = await originalFetch(...args);
      const end = performance.now();
      
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || (args[0] as Request).method || "GET").toUpperCase();

      window.postMessage({
        source: "react-perf-detector",
        type: "api_request",
        endpoint: url,
        method,
        statusCode: response.status,
        latency: Math.round(end - start),
        responseSize: 0, // 실제 body 크기 계산은 오버헤드 방지를 위해 생략하거나 간단히 구현
        timestamp: Date.now()
      }, "*");

      return response;
    } catch (err) {
      const end = performance.now();
      window.postMessage({
        source: "react-perf-detector",
        type: "api_request",
        endpoint: typeof args[0] === "string" ? args[0] : (args[0] as Request).url,
        method: "FETCH",
        statusCode: 0,
        latency: Math.round(end - start),
        responseSize: 0,
        timestamp: Date.now()
      }, "*");
      throw err;
    }
  };

  // XMLHttpRequest 가로채기
  const originalXHR = window.XMLHttpRequest;
  function InstrumentedXHR() {
    const xhr = new originalXHR();
    const start = performance.now();
    let method = "GET";
    let url = "";

    const originalOpen = xhr.open;
    xhr.open = function (m, u, ...rest: any[]) {
      method = m;
      url = u instanceof URL ? u.toString() : u;
      return (originalOpen as any).apply(this, [m, u, ...rest]);
    };

    xhr.addEventListener("load", () => {
      const end = performance.now();
      window.postMessage({
        source: "react-perf-detector",
        type: "api_request",
        endpoint: url,
        method,
        statusCode: xhr.status,
        latency: Math.round(end - start),
        responseSize: 0,
        timestamp: Date.now()
      }, "*");
    });

    return xhr;
  }
  (window as any).XMLHttpRequest = InstrumentedXHR;

  console.log("[ReactPerf] Network Interceptor active.");
})();
