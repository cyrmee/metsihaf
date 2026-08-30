"use client";

import { createContext, useContext } from "react";

export type SessionUser = { email: string | null };

export type SessionContextValue = {
  /** undefined while loading, null when signed out. */
  user: SessionUser | null | undefined;
  /** Re-checks the session (call after sign-in/up/out). */
  refresh: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue>({
  user: undefined,
  refresh: async () => {},
});

/** The current session, reactive to sign-in/out triggered anywhere under AuthProvider. */
export function useSession() {
  return useContext(SessionContext);
}
