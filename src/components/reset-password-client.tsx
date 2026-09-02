"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { completePasswordReset } from "@/app/actions/auth";
import { useSession } from "@/lib/use-session";

type Stage =
  | { kind: "checking" }
  | { kind: "invalid" }
  | { kind: "ready"; accessToken: string; refreshToken: string }
  | { kind: "done" };

export function ResetPasswordClient() {
  const router = useRouter();
  const { refresh } = useSession();
  const [stage, setStage] = useState<Stage>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Supabase puts the recovery tokens in the URL fragment, which never
  // reaches the server — so this has to run client-side.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    if (accessToken && refreshToken && type === "recovery") {
      history.replaceState(null, "", window.location.pathname);
      setStage({ kind: "ready", accessToken, refreshToken });
    } else {
      setStage({ kind: "invalid" });
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (stage.kind !== "ready") return;
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const result = await completePasswordReset(stage.accessToken, stage.refreshToken, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refresh();
    setStage({ kind: "done" });
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 text-center">
      <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
        Account / 00
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
        Reset your password
      </h1>

      {stage.kind === "checking" && (
        <p className="mt-6 text-sm text-muted-foreground">Checking your link…</p>
      )}

      {stage.kind === "invalid" && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            This reset link is invalid or has expired. Request a new one from Settings.
          </p>
          <Link
            href="/settings"
            className="focus-editorial mt-6 inline-flex items-center justify-center bg-signal px-4 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase hover:bg-signal-hover"
          >
            Go to Settings
          </Link>
        </>
      )}

      {stage.kind === "ready" && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">Choose a new password below.</p>
          <form onSubmit={submit} className="mt-6 flex w-full flex-col gap-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-editorial w-full border border-[#b8b4aa] bg-paper-white px-3 py-2 pr-9 text-sm text-ink"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="focus-editorial absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-muted hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="focus-editorial w-full border border-[#b8b4aa] bg-paper-white px-3 py-2 text-sm text-ink"
            />
            <button
              type="submit"
              disabled={busy}
              className="focus-editorial mt-1 flex items-center justify-center gap-1.5 bg-signal px-3 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase hover:bg-signal-hover disabled:opacity-50"
            >
              <KeyRound className="h-3.5 w-3.5" /> Set new password
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </>
      )}

      {stage.kind === "done" && (
        <>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary" /> Password updated. You&apos;re signed in.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/settings")}
            className="focus-editorial mt-6 inline-flex items-center justify-center bg-signal px-4 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase hover:bg-signal-hover"
          >
            Continue to Settings
          </button>
        </>
      )}
    </div>
  );
}
