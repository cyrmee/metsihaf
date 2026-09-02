import type { QueryClient } from "@tanstack/react-query";
import { BOOKS } from "@/data/books";
import type { ChapterData, ChapterStudyNotes, TranslationId } from "@/lib/bible";

export interface DownloadProgress {
  done: number;
  total: number;
}

/** How many book-fetches run at once — enough to be fast without hammering the DB or the browser's connection limit. */
const CONCURRENCY = 4;

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json() as Promise<T>;
}

async function runPool(tasks: (() => Promise<void>)[], onStep: () => void, signal: AbortSignal) {
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      if (signal.aborted) return;
      const i = next++;
      const task = tasks[i];
      if (task) await task();
      onStep();
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker));
}

/**
 * Downloads every chapter of the given translations, plus every chapter's
 * study notes (fetched once, since notes are translation-independent), and
 * seeds them straight into the query cache under the same keys useChapter /
 * useStudyNotes read from — so once this finishes, opening any chapter is an
 * instant cache hit and the persisted copy in IndexedDB survives offline.
 */
export async function downloadAllOffline(
  queryClient: QueryClient,
  translations: TranslationId[],
  onProgress: (p: DownloadProgress) => void,
  signal: AbortSignal,
): Promise<void> {
  const total = BOOKS.length * (translations.length + 1);
  let done = 0;
  const report = () => onProgress({ done: ++done, total });

  const noteTasks = BOOKS.map((book) => async () => {
    const res = await fetchJson<{ book: string; chapters: ChapterStudyNotes[] }>(
      `/api/study-notes/book?book=${book.id}`,
      signal,
    );
    for (const chapterNotes of res.chapters) {
      queryClient.setQueryData(["study-notes", book.id, chapterNotes.chapter], chapterNotes);
    }
  });

  const chapterTasks = translations.flatMap((translation) =>
    BOOKS.map((book) => async () => {
      const res = await fetchJson<{ book: string; translation: string; chapters: ChapterData[] }>(
        `/api/chapter/book?translation=${translation}&book=${book.id}`,
        signal,
      );
      for (const chapterData of res.chapters) {
        queryClient.setQueryData(
          ["chapter", translation, book.id, chapterData.chapter],
          chapterData,
        );
      }
    }),
  );

  await runPool([...noteTasks, ...chapterTasks], report, signal);
}
