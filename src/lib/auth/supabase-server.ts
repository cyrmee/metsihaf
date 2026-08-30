/**
 * Server-only Supabase Auth client. Never imported by client components —
 * it holds no session itself; callers pass tokens in explicitly and we
 * persist them ourselves as httpOnly cookies (see ./session.ts).
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_ANON_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
