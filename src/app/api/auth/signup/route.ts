import { createUser, getUserByEmail } from "@/services/userService";
import { errorResponse, successResponse } from "@/lib/apiHelpers";

interface SignupPayload {
  email: string;
  password: string;
}

export async function POST(request: Request): Promise<Response> {
  let body: SignupPayload;
  try {
    body = (await request.json()) as SignupPayload;
  } catch {
    return errorResponse("INVALID_BODY");
  }

  if (!body.email || !body.password) {
    return errorResponse("MISSING_FIELDS");
  }

  if (body.password.length < 8) {
    return errorResponse("PASSWORD_TOO_SHORT");
  }

  const existing = await getUserByEmail(body.email);
  if (existing) return errorResponse("EMAIL_ALREADY_EXISTS", 409);

  const user = await createUser(body.email, body.password);
  return successResponse({ id: user.id, email: user.email, plan: user.plan });
}
