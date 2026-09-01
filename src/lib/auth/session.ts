/**
 * Server-only session storage: the Supabase access/refresh tokens live in
 * httpOnly cookies, never in localStorage or client-readable JS. Client code
 * never sees a token — it only ever learns whether a session exists (see the
 * `getSessionUser` server action in `src/app/actions/auth.ts`).
 */
import "server-only";
import { cookies } from "next/headers";
import { supabaseServer } from "./supabase-server";

export const ACCESS_COOKIE = "sb-access-token";
export const REFRESH_COOKIE = "sb-refresh-token";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setSessionCookies(session: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in,
  });
  store.set(REFRESH_COOKIE, session.refresh_token, { ...cookieOptions, maxAge: THIRTY_DAYS });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Returns a usable access token, transparently refreshing it via the refresh-token cookie if needed. */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (accessToken) return accessToken;

  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const { data, error } = await supabaseServer().auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    await clearSessionCookies();
    return null;
  }
  await setSessionCookies(data.session);
  return data.session.access_token;
}

/** Forces a refresh even if the access-token cookie hasn't expired yet (used after a 401 from the API). */
export async function forceRefreshAccessToken(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const { data, error } = await supabaseServer().auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    await clearSessionCookies();
    return null;
  }
  await setSessionCookies(data.session);
  return data.session.access_token;
}

export async function getSessionUser(): Promise<{ email: string | null } | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const {
    data: { user },
  } = await supabaseServer().auth.getUser(token);
  if (!user) return null;
  return { email: user.email ?? null };
}
