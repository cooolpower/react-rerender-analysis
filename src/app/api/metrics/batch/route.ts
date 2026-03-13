import { validateApiKey, unauthorizedResponse, successResponse, errorResponse } from "@/lib/apiHelpers";
import { saveMetricsBatch } from "@/services/sessionService";
import type { MetricsBatchPayload } from "@/types/metrics";

const MAX_EVENTS_PER_BATCH = 50;

export async function POST(request: Request): Promise<Response> {
  const user = await validateApiKey(request);
  if (!user) return unauthorizedResponse();

  let body: MetricsBatchPayload;
  try {
    body = (await request.json()) as MetricsBatchPayload;
  } catch {
    return errorResponse("INVALID_BODY");
  }

  if (!body.sessionId) return errorResponse("MISSING_SESSION_ID");
  if (!Array.isArray(body.events)) return errorResponse("INVALID_EVENTS");
  if (body.events.length > MAX_EVENTS_PER_BATCH) {
    return errorResponse("TOO_MANY_EVENTS");
  }

  await saveMetricsBatch(body);
  return successResponse(null);
}
