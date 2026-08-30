"use client";

import { useState, type FormEvent } from "react";
import { LogIn, LogOut, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase.client";
import { useSession } from "@/lib/use-session";

/** Sign in/up form and account status, in Settings. Syncing itself is handled by AuthSyncProvider. */
export function AccountSection() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [status, setStatus] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (session === undefined) return null;

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="flex items-center gap-1.5 text-sm text-foreground">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          {session.user.email}
        </p>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Bookmarks, highlights, notes and preferences sync to your account.
        </p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="focus-carbon mt-1 flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    const { error } =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setStatus({ kind: "error", text: error.message });
      return;
    }
    if (mode === "signUp") {
      setStatus({ kind: "info", text: "Check your email to confirm your account." });
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Sign in to sync bookmarks, highlights, notes and preferences across devices. Data stays on
        this device otherwise.
      </p>
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-2">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-carbon border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus-carbon border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={busy}
          className="focus-carbon flex items-center justify-center gap-1.5 border border-primary bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <LogIn className="h-3.5 w-3.5" />
          {mode === "signIn" ? "Sign in" : "Create account"}
        </button>
      </form>
      {status && (
        <p
          className={`text-xs ${status.kind === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {status.text}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
          setStatus(null);
        }}
        className="focus-carbon text-xs text-primary hover:underline"
      >
        {mode === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
