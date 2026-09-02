import { NextResponse } from "next/server";
import { BOOK_BY_ID } from "@/data/books";
import type { ChapterStudyNotes } from "@/lib/bible";
import { BIBLE_CACHE_CONTROL } from "@/lib/cache-control";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { getStudyNotesForBook } from "@/lib/db/verse-db";

export const runtime = "nodejs";

/** Every study note in one book, grouped by chapter — the batch counterpart to /api/study-notes, used for offline download. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get("book") ?? "";

    const bookMeta = BOOK_BY_ID[book];
    if (!bookMeta) {
      return NextResponse.json(
        { statusCode: 400, error: "Bad Request", message: `Unknown book: ${book}` },
        { status: 400 },
      );
    }

    const rows = await getStudyNotesForBook(book);
    const byChapter = new Map<number, ChapterStudyNotes["notes"]>();
    for (const r of rows) {
      const note = { verse: r.verse, verseEnd: r.verseEnd, text: r.text, source: r.source };
      const list = byChapter.get(r.chapter);
      if (list) list.push(note);
      else byChapter.set(r.chapter, [note]);
    }

    const chapters: ChapterStudyNotes[] = [...byChapter.entries()]
      .map(([chapter, notes]) => ({ book, chapter, notes }))
      .sort((a, b) => a.chapter - b.chapter);

    return NextResponse.json(
      { book, chapters },
      { headers: { "Cache-Control": BIBLE_CACHE_CONTROL } },
    );
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
