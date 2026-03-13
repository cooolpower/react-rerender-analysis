import { getUserByApiKey } from "@/services/userService";
import type { User } from "@/types/user";

export async function validateApiKey(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice("Bearer ".length).trim();
  if (!apiKey) return null;

  return getUserByApiKey(apiKey);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function unauthorizedResponse(): Response {
  return Response.json(
    { success: false, data: null, error: "INVALID_API_KEY" },
    { status: 401, headers: CORS_HEADERS }
  );
}

export function errorResponse(message: string, status = 400): Response {
  return Response.json(
    { success: false, data: null, error: message },
    { status, headers: CORS_HEADERS }
  );
}

export function successResponse<T>(data: T): Response {
  return Response.json(
    { success: true, data, error: null },
    { headers: CORS_HEADERS }
  );
}

export function optionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
