import { useQuery } from "@tanstack/react-query";
import type { ChapterData, TranslationId } from "@/lib/bible";

async function fetchChapter(
  translation: TranslationId,
  book: string,
  chapter: number,
): Promise<ChapterData> {
  const params = new URLSearchParams({ translation, book, chapter: String(chapter) });
  const res = await fetch(`/api/chapter?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to load chapter");
  }
  return res.json() as Promise<ChapterData>;
}

/** Load a chapter for any version stored in the Verse table. */
export function useChapter(translation: TranslationId, book: string, chapter: number) {
  return useQuery<ChapterData>({
    queryKey: ["chapter", translation, book, chapter],
    queryFn: () => fetchChapter(translation, book, chapter),
    staleTime: 1000 * 60 * 60, // scripture doesn't change; cache an hour
    gcTime: 1000 * 60 * 60 * 6,
  });
}
