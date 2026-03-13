export type Plan = "FREE" | "PRO";

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
  events: MetricEvent[];
}

export interface SessionStartPayload {
  url: string;
  timestamp: number;
}

export interface SessionStartResponse {
  sessionId: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  data: T;
  error: string | null;
}
