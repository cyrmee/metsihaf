import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ReadChapterClient } from "@/components/read-chapter-client";
import { BOOK_BY_ID } from "@/data/books";
import { getChapterData, getStudyNotesData } from "@/lib/db/chapter-service";
import { parseReadingPrefsCookie, READING_PREFS_COOKIE_NAME } from "@/lib/local-store";

type Params = Promise<{ book: string; chapter: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { book: bookId, chapter } = await params;
  const book = BOOK_BY_ID[bookId];
  const name = book ? book.nameEn : "Bible";
  const title = `${name} - Metsihaf Bible`;
  const description = `Read ${name} chapter ${chapter} in Amharic 1954 and BSB, highlights and notes.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

const DEFAULT_TRANSLATION = "HSAB";

export default async function Page({ params }: { params: Params }) {
  const { book, chapter } = await params;
  const chapterNum = Number(chapter);

  const store = await cookies();
  const translation = store.get("bible.translation")?.value || DEFAULT_TRANSLATION;

  // Fetches this chapter's text and study notes on the server and seeds them
  // into the client component's React Query cache (see `initialChapterData`/
  // `initialStudyNotesData` below), so the first chapter view — including its
  // study-note icons — renders straight from the initial HTML response
  // instead of the icons popping in a moment after the verse text once a
  // client-side fetch resolves. Falls back to null (normal client fetch) for
  // anything invalid — never a new failure mode.
  const [initialChapterData, initialStudyNotesData] = await Promise.all([
    getChapterData(translation, book, chapterNum).catch(() => null),
    getStudyNotesData(book, chapterNum).catch(() => null),
  ]);

  // Display prefs (text size, spacing, font) are mirrored into a cookie the
  // same way — see parseReadingPrefsCookie — so the page renders with the
  // reader's actual settings from the first paint instead of a hardcoded
  // default that then visibly resizes once localStorage is read on mount.
  const initialReadingPrefs = parseReadingPrefsCookie(store.get(READING_PREFS_COOKIE_NAME)?.value);

  return (
    <ReadChapterClient
      book={book}
      chapter={chapter}
      initialTranslation={translation}
      initialChapterData={initialChapterData}
      initialStudyNotesData={initialStudyNotesData}
      initialReadingPrefs={initialReadingPrefs}
    />
  );
}
