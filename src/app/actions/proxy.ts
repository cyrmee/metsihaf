"use server";

import { API_BASE } from "@/lib/api-base";
import { forceRefreshAccessToken, getAccessToken } from "@/lib/auth/session";

export type ProxyResult = { ok: boolean; status: number; body: unknown } | null;

async function send(path: string, token: string, init?: { method?: string; body?: string }) {
  return fetch(`${API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(init?.body !== undefined ? { body: init.body } : {}),
    cache: "no-store",
  });
}

/**
 * Calls the NestJS backend with the caller's Supabase access token attached
 * server-side, read from an httpOnly cookie — the token never reaches the
 * browser. Retries once with a forced refresh on a 401.
 */
export async function authedApiFetch(
  path: string,
  init?: { method?: string; body?: string },
): Promise<ProxyResult> {
  const token = await getAccessToken();
  if (!token) return null;

  let res = await send(path, token, init);
  if (res.status === 401) {
    const refreshed = await forceRefreshAccessToken();
    if (!refreshed) return null;
    res = await send(path, refreshed, init);
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // No/invalid JSON body — leave as null.
  }
  return { ok: res.ok, status: res.status, body };
}
