export interface RenderMetricEvent {
  type: "component_render";
  componentName: string;
  renderTime: number;
  timestamp: number;
}

export interface ApiRequestEvent {
  type: "api_request";
  endpoint: string;
  method: string;
  statusCode: number;
  latency: number;
  responseSize: number;
  timestamp: number;
}

export type MetricEvent = RenderMetricEvent | ApiRequestEvent;

export interface MetricsBatchPayload {
  sessionId: string;
  pageVisitId?: string;
  events: MetricEvent[];
}

export interface ExtensionMessage {
  type: "SESSION_STARTED" | "PAGE_STARTED" | "METRIC_EVENT" | "SESSION_ENDED";
  payload: unknown;
}

export interface StorageData {
  apiKey?: string;
  sessionId?: string;
  backendUrl?: string;
}
