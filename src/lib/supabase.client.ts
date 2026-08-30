/**
 * Browser-side Supabase client for Auth (sign in/up/out, session access).
 * Uses the public anon key — safe to expose.
 */
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
  process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
);
