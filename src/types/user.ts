export interface User {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
  role: "ADMIN" | "USER";
  apiKey: string;
  createdAt: Date;
}

export interface AuthSession {
  user: Pick<User, "id" | "email" | "plan" | "role" | "apiKey">;
}
