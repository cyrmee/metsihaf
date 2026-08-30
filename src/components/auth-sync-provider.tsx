"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/use-session";
import { startRemoteSync } from "@/lib/remote-sync";

/** Starts pushing/pulling local-store data to the server whenever a Supabase session exists. */
export function AuthSyncProvider({ children }: { children: ReactNode }) {
  const session = useSession();

  useEffect(() => {
    if (!session) return;
    return startRemoteSync();
  }, [session]);

  return children;
}
