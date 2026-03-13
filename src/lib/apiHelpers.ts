import { getUserByApiKey } from "@/services/userService";
import type { User } from "@/types/user";

export async function validateApiKey(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice("Bearer ".length).trim();
  if (!apiKey) return null;

  return getUserByApiKey(apiKey);
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { success: false, data: null, error: "INVALID_API_KEY" },
    { status: 401 }
  );
}

export function errorResponse(message: string, status = 400): Response {
  return Response.json(
    { success: false, data: null, error: message },
    { status }
  );
}

export function successResponse<T>(data: T): Response {
  return Response.json({ success: true, data, error: null });
}
