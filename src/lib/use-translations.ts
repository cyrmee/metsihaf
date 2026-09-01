import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Translation } from "@/lib/bible";

async function fetchTranslations(): Promise<Translation[]> {
  const res = await fetch("/api/translations");
  if (!res.ok) throw new Error("Failed to load translations");
  const body = (await res.json()) as { translations: Translation[] };
  return body.translations;
}

/** Every version available in the Verse table, with an id → Translation lookup. */
export function useTranslations() {
  const query = useQuery<Translation[]>({
    queryKey: ["translations"],
    queryFn: fetchTranslations,
    staleTime: 1000 * 60 * 60, // the available versions rarely change; cache an hour
    gcTime: 1000 * 60 * 60 * 6,
  });
  const data = query.data;
  const translations = useMemo(() => data ?? [], [data]);
  const byId = useMemo(
    () => Object.fromEntries(translations.map((t) => [t.id, t])) as Record<string, Translation>,
    [translations],
  );
  return { translations, byId, isLoading: query.isLoading };
}
