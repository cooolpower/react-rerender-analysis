import { validateApiKey, unauthorizedResponse, successResponse, errorResponse, optionsResponse } from "@/lib/apiHelpers";
import { trackPageVisit } from "@/services/sessionService";
import type { PageVisitPayload, PageVisitResponse } from "@/types/metrics";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request): Promise<Response> {
  const user = await validateApiKey(request);
  if (!user) return unauthorizedResponse();

  let body: PageVisitPayload;
  try {
    body = (await request.json()) as PageVisitPayload;
  } catch {
    return errorResponse("INVALID_BODY");
  }

  if (!body.sessionId) return errorResponse("MISSING_SESSION_ID");
  if (!body.url) return errorResponse("MISSING_URL");

  try {
    const pageVisitId = await trackPageVisit(body.sessionId, body.url);
    return successResponse<PageVisitResponse>({ pageVisitId });
  } catch (err: any) {
    console.error("[API] Error tracking page visit:", err);
    return errorResponse(err.message || "INTERNAL_ERROR", 500);
  }
}
