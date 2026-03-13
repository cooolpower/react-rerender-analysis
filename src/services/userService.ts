import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import type { User } from "@/types/user";

export async function createUser(
  email: string,
  password: string
): Promise<User> {
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
    role: user.role as "ADMIN" | "USER",
    apiKey: user.apiKey,
    createdAt: user.createdAt,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
    role: user.role as "ADMIN" | "USER",
    apiKey: user.apiKey,
    createdAt: user.createdAt,
  };
}

export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { apiKey },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
    role: user.role as "ADMIN" | "USER",
    apiKey: user.apiKey,
    createdAt: user.createdAt,
  };
}
