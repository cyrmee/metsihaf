"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, LogOut, Mail } from "lucide-react";
import { requestPasswordReset, signIn, signOut, signUp } from "@/app/actions/auth";
import { useSession } from "@/lib/use-session";

/** Sign in/up form and account status, in Settings. Syncing itself is handled by AuthSyncProvider. */
export function AccountSection() {
  const { user, refresh } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [status, setStatus] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (user === undefined) return null;

  if (user) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="flex items-center gap-1.5 text-sm text-foreground">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          {user.email}
        </p>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Bookmarks, highlights, notes and preferences sync to your account.
        </p>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            await refresh();
          }}
          className="focus-editorial mt-1 flex items-center gap-1.5 border border-ink px-3 py-2 text-xs text-ink hover:bg-ink hover:text-paper-white"
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
    const result =
      mode === "signIn" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setStatus({ kind: "error", text: result.error });
      return;
    }
    if (mode === "signUp" && "needsConfirmation" in result && result.needsConfirmation) {
      setStatus({ kind: "info", text: "Check your email to confirm your account." });
      return;
    }
    await refresh();
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      setStatus({ kind: "error", text: "Enter your email above, then try again." });
      return;
    }
    setStatus(null);
    setBusy(true);
    const result = await requestPasswordReset(
      email.trim(),
      `${window.location.origin}/reset-password`,
    );
    setBusy(false);
    setStatus({
      kind: result.error ? "error" : "info",
      text:
        result.error ?? "If that email has an account, we've sent a link to reset your password.",
    });
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
          className="focus-editorial border border-[#b8b4aa] bg-paper-white px-3 py-2 text-sm text-ink"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-editorial w-full border border-[#b8b4aa] bg-paper-white px-3 py-2 pr-9 text-sm text-ink"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="focus-editorial absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="focus-editorial flex items-center justify-center gap-1.5 bg-signal px-3 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase hover:bg-signal-hover disabled:opacity-50"
        >
          <LogIn className="h-3.5 w-3.5" />
          {mode === "signIn" ? "Sign in" : "Create account"}
        </button>
      </form>
      {mode === "signIn" && (
        <button
          type="button"
          onClick={forgotPassword}
          disabled={busy}
          className="focus-editorial text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Forgot password?
        </button>
      )}
      {status && (
        <p
          className={`max-w-xs text-center text-xs ${status.kind === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {status.text}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
          setPassword("");
          setShowPassword(false);
          setStatus(null);
        }}
        className="focus-editorial text-xs text-primary hover:underline"
      >
        {mode === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
