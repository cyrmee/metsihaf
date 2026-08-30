"use server";

import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/auth/supabase-server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  getSessionUser,
  setSessionCookies,
} from "@/lib/auth/session";

export async function getSession() {
  return getSessionUser();
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseServer().auth.signInWithPassword({ email, password });
  if (error || !data.session) return { error: error?.message ?? "Sign in failed" };
  await setSessionCookies(data.session);
  return { error: null };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabaseServer().auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (data.session) await setSessionCookies(data.session);
  return { error: null, needsConfirmation: !data.session };
}

export async function signOut() {
  // Best-effort: revoke the refresh token server-side too, not just locally.
  const store = await cookies();
  const access_token = store.get(ACCESS_COOKIE)?.value;
  const refresh_token = store.get(REFRESH_COOKIE)?.value;
  if (access_token && refresh_token) {
    const client = supabaseServer();
    await client.auth.setSession({ access_token, refresh_token });
    await client.auth.signOut();
  }
  await clearSessionCookies();
}
