import "server-only";
import { unstable_cache } from "next/cache";
import { BOOK_BY_ID } from "@/data/books";
import type { ChapterData, ChapterStudyNotes, Footnote } from "@/lib/bible";
import { BIBLE_CACHE_REVALIDATE_SECONDS } from "@/lib/cache-control";
import { loadCrossrefs } from "@/lib/db/crossrefs";
import { getAvailableTranslations, getChapterRows, getStudyNotes } from "@/lib/db/verse-db";

/**
 * Same shape as `/api/chapter`, for use directly from a Server Component so
 * the reading page can seed its first chapter's data into the initial HTML
 * response instead of waiting for a client-side fetch after hydration.
 * Returns null on anything invalid rather than throwing — the caller falls
 * back to letting the client fetch normally, so this is purely an
 * optimization, never a new failure mode.
 *
 * Wrapped in `unstable_cache`, keyed only on (translation, book, chapter) —
 * not on anything request-specific like the reading-position cookie the
 * caller also reads — so this is shared across every visitor asking for the
 * same chapter, the same way `/api/chapter`'s CDN cache used to be, instead
 * of hitting Postgres on every request just because the route also reads a
 * cookie (which makes Next treat the whole route as dynamic/uncached).
 */
export const getChapterData = unstable_cache(
  async (translation: string, book: string, chapter: number): Promise<ChapterData | null> =>
    fetchChapterData(translation, book, chapter),
  ["chapter-data"],
  { revalidate: BIBLE_CACHE_REVALIDATE_SECONDS },
);

async function fetchChapterData(
  translation: string,
  book: string,
  chapter: number,
): Promise<ChapterData | null> {
  const bookMeta = BOOK_BY_ID[book];
  if (!bookMeta || !Number.isInteger(chapter) || chapter < 1 || chapter > bookMeta.chapters) {
    return null;
  }

  const available = await getAvailableTranslations();
  if (!available.some((t) => t.id === translation)) return null;

  const crossRefs = loadCrossrefs();
  const rows = await getChapterRows(translation, book, chapter);
  const verses = rows.map((r) => {
    const refs = new Set<string>();
    for (let v = r.verse; v <= r.verseEnd; v++) {
      for (const ref of crossRefs[`${book}.${chapter}.${v}`] ?? []) refs.add(ref);
    }
    const redLetter = r.redLetter as [number, number][] | null;
    const footnotes = r.footnotes as Footnote[] | null;
    return {
      verse: r.verse,
      verseEnd: r.verseEnd,
      label: r.label,
      text: r.text,
      refs: [...refs],
      ...(redLetter ? { redLetter } : {}),
      ...(footnotes ? { footnotes } : {}),
      ...(r.heading ? { heading: r.heading } : {}),
      ...(r.subheading ? { subheading: r.subheading } : {}),
      ...(r.poetic ? { poetic: true } : {}),
    };
  });

  return { book, chapter, translation, verses };
}

/**
 * Same shape as `/api/study-notes`, for the same SSR-seeding reason as
 * `getChapterData` above — without this, the study-note icons only appear
 * once the client-side fetch resolves a moment after the verse text itself
 * (which is already seeded), visibly popping in after first paint.
 * Translation-independent, so keyed only on (book, chapter).
 */
export const getStudyNotesData = unstable_cache(
  async (book: string, chapter: number): Promise<ChapterStudyNotes | null> => {
    const bookMeta = BOOK_BY_ID[book];
    if (!bookMeta || !Number.isInteger(chapter) || chapter < 1 || chapter > bookMeta.chapters) {
      return null;
    }
    const notes = await getStudyNotes(book, chapter);
    return {
      book,
      chapter,
      notes: notes.map((n) => ({
        verse: n.verse,
        verseEnd: n.verseEnd,
        text: n.text,
        source: n.source,
      })),
    };
  },
  ["study-notes-data"],
  { revalidate: BIBLE_CACHE_REVALIDATE_SECONDS },
);
