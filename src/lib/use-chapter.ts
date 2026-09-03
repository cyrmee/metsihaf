import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChapterData, ChapterStudyNotes, TranslationId } from "@/lib/bible";

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
export function useChapter(
  translation: TranslationId,
  book: string,
  chapter: number,
  options?: { enabled?: boolean; initialData?: ChapterData },
) {
  return useQuery<ChapterData>({
    queryKey: ["chapter", translation, book, chapter],
    queryFn: () => fetchChapter(translation, book, chapter),
    staleTime: Infinity, // scripture text never changes once fetched; persisted for offline reading
    gcTime: Infinity, // a finite value here overflows setTimeout's 32-bit limit and GCs almost immediately
    enabled: options?.enabled ?? true,
    ...(options?.initialData !== undefined ? { initialData: options.initialData } : {}),
  });
}

/** Prefetch a chapter so navigating to it is instant (no fetch waterfall). */
export function usePrefetchChapter() {
  const queryClient = useQueryClient();
  return (translation: TranslationId, book: string, chapter: number) => {
    queryClient.prefetchQuery({
      queryKey: ["chapter", translation, book, chapter],
      queryFn: () => fetchChapter(translation, book, chapter),
      staleTime: Infinity,
    });
  };
}

async function fetchStudyNotes(book: string, chapter: number): Promise<ChapterStudyNotes> {
  const params = new URLSearchParams({ book, chapter: String(chapter) });
  const res = await fetch(`/api/study-notes?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to load study notes");
  }
  return res.json() as Promise<ChapterStudyNotes>;
}

/**
 * Load a chapter's study-note commentary. Kept as its own query (rather than
 * folded into useChapter) because notes are translation-independent — one
 * fetch and one cache entry serve every version of this chapter, and
 * switching translations never re-fetches them.
 */
export function useStudyNotes(
  book: string,
  chapter: number,
  options?: { initialData?: ChapterStudyNotes },
) {
  return useQuery<ChapterStudyNotes>({
    queryKey: ["study-notes", book, chapter],
    queryFn: () => fetchStudyNotes(book, chapter),
    staleTime: Infinity,
    gcTime: Infinity, // a finite value here overflows setTimeout's 32-bit limit and GCs almost immediately
    ...(options?.initialData !== undefined ? { initialData: options.initialData } : {}),
  });
}
