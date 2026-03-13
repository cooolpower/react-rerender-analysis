import { validateApiKey, unauthorizedResponse, successResponse, errorResponse } from "@/lib/apiHelpers";
import { endSession } from "@/services/sessionService";

interface EndSessionPayload {
  sessionId: string;
}

export async function POST(request: Request): Promise<Response> {
  const user = await validateApiKey(request);
  if (!user) return unauthorizedResponse();

  let body: EndSessionPayload;
  try {
    body = (await request.json()) as EndSessionPayload;
  } catch {
    return errorResponse("INVALID_BODY");
  }

  if (!body.sessionId) return errorResponse("MISSING_SESSION_ID");

  await endSession(body.sessionId);
  return successResponse(null);
}
