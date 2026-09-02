"use client";

import { useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

// Chapter text and study notes are static once fetched, so persist them to
// IndexedDB: once a chapter has been opened, it stays readable offline and
// isn't re-downloaded on the next visit or app restart. Everything else
// (search results, translation lists, etc.) stays memory-only.
const PERSISTED_QUERY_KEYS = new Set(["chapter", "study-notes"]);

const idbStorage = {
  getItem: async (key: string) => (await get(key)) ?? null,
  setItem: (key: string, value: string) => set(key, value),
  removeItem: (key: string) => del(key),
};

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 1000 * 60 } },
      }),
  );
  const [persister] = useState(() => createAsyncStoragePersister({ storage: idbStorage }));

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: Infinity,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            PERSISTED_QUERY_KEYS.has(query.queryKey[0] as string) &&
            query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
