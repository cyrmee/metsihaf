"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getSession } from "@/app/actions/auth";
import { startRemoteSync } from "@/lib/remote-sync";
import { SessionContext, type SessionUser } from "@/lib/use-session";

/**
 * Provides the current session (checked server-side against the httpOnly
 * session cookies — the browser never holds a token) and starts
 * pushing/pulling local-store data to the server whenever a session exists.
 */
export function AuthSyncProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    setUser(await getSession());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return startRemoteSync();
  }, [user]);

  return <SessionContext.Provider value={{ user, refresh }}>{children}</SessionContext.Provider>;
}
