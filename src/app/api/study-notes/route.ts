import { NextResponse } from "next/server";
import { BOOK_BY_ID } from "@/data/books";
import type { ChapterStudyNotes } from "@/lib/bible";
import { BIBLE_CACHE_CONTROL } from "@/lib/cache-control";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { getStudyNotes } from "@/lib/db/verse-db";
import { asPositiveInt } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Study-note commentary for a chapter, kept as its own endpoint (separate
 * from /api/chapter) because it's translation-independent — the same notes
 * apply no matter which version you're reading — so it deserves its own
 * cache entry instead of being re-fetched every time the translation changes.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get("book") ?? "";
    const chapter = asPositiveInt(searchParams.get("chapter"), "chapter");

    const bookMeta = BOOK_BY_ID[book];
    if (!bookMeta || chapter > bookMeta.chapters) {
      return NextResponse.json(
        { statusCode: 400, error: "Bad Request", message: `Unknown chapter: ${book} ${chapter}` },
        { status: 400 },
      );
    }

    const notes = await getStudyNotes(book, chapter);
    const body: ChapterStudyNotes = {
      book,
      chapter,
      notes: notes.map((n) => ({
        verse: n.verse,
        verseEnd: n.verseEnd,
        text: n.text,
        source: n.source,
      })),
    };
    return NextResponse.json(body, { headers: { "Cache-Control": BIBLE_CACHE_CONTROL } });
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
