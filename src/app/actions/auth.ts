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

export async function requestPasswordReset(email: string, redirectTo: string) {
  const { error } = await supabaseServer().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };
  return { error: null };
}

/** Completes a reset from the tokens Supabase put in the email link's URL fragment. */
export async function completePasswordReset(
  accessToken: string,
  refreshToken: string,
  password: string,
) {
  const client = supabaseServer();
  const { data, error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    return { error: error?.message ?? "That reset link is invalid or has expired." };
  }
  const { error: updateError } = await client.auth.updateUser({ password });
  if (updateError) return { error: updateError.message };
  await setSessionCookies(data.session);
  return { error: null };
}

export async function signOut() {
  // Best-effort: revoke the refresh token server-side too, not just locally.
  const store = await cookies();
  let access_token = store.get(ACCESS_COOKIE)?.value;
  const refresh_token = store.get(REFRESH_COOKIE)?.value;
  if (refresh_token) {
    const client = supabaseServer();
    if (!access_token) {
      const { data } = await client.auth.refreshSession({ refresh_token });
      access_token = data.session?.access_token;
    }
    if (access_token) {
      await client.auth.setSession({ access_token, refresh_token });
      await client.auth.signOut();
    }
  }
  await clearSessionCookies();
}
