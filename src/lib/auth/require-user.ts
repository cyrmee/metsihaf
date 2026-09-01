import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getAccessToken } from "./session";
import { supabaseServer } from "./supabase-server";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not signed in.");
  }
}

/**
 * Verifies the caller's Supabase session (from the httpOnly session cookies)
 * and returns the local Prisma `User` row, upserted by `authUid`. Replaces
 * the NestJS backend's `SupabaseAuthGuard` + `@CurrentUser()`.
 */
export async function requireUser() {
  const token = await getAccessToken();
  if (!token) throw new UnauthenticatedError();

  const { data, error } = await supabaseServer().auth.getUser(token);
  if (error || !data.user) throw new UnauthenticatedError();

  return prisma.user.upsert({
    where: { authUid: data.user.id },
    create: { authUid: data.user.id, email: data.user.email ?? null },
    update: { email: data.user.email ?? null },
  });
}
