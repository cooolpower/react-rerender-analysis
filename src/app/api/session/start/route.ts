import { validateApiKey, unauthorizedResponse, successResponse, errorResponse, optionsResponse } from "@/lib/apiHelpers";
import { createSession } from "@/services/sessionService";
import type { SessionStartPayload, SessionStartResponse } from "@/types/metrics";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request): Promise<Response> {
  const user = await validateApiKey(request);
  if (!user) return unauthorizedResponse();

  let body: SessionStartPayload;
  try {
    body = (await request.json()) as SessionStartPayload;
  } catch {
    return errorResponse("INVALID_BODY");
  }

  if (!body.origin) return errorResponse("MISSING_ORIGIN");
  
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const sessionId = await createSession(user.id, body.origin, userAgent);

  return successResponse<SessionStartResponse>({ sessionId });
}
