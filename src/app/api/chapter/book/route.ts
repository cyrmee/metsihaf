import { NextResponse } from "next/server";
import { BOOK_BY_ID } from "@/data/books";
import type { ChapterData, Footnote } from "@/lib/bible";
import { BIBLE_CACHE_CONTROL } from "@/lib/cache-control";
import { loadCrossrefs } from "@/lib/db/crossrefs";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { getAvailableTranslations, getBookRows } from "@/lib/db/verse-db";
import { asIn } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Every chapter of one book, in one response — used by the offline "download
 * everything" flow so it doesn't have to make one request per chapter (up to
 * 150, for Psalms) to fetch a whole translation.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const available = await getAvailableTranslations();
    const translation = asIn(
      searchParams.get("translation"),
      available.map((t) => t.id),
      "translation",
    );
    const book = searchParams.get("book") ?? "";

    const bookMeta = BOOK_BY_ID[book];
    if (!bookMeta) {
      return NextResponse.json(
        { statusCode: 400, error: "Bad Request", message: `Unknown book: ${book}` },
        { status: 400 },
      );
    }

    const crossRefs = loadCrossrefs();
    const rows = await getBookRows(translation, book);
    const byChapter = new Map<number, typeof rows>();
    for (const r of rows) {
      const list = byChapter.get(r.chapter);
      if (list) list.push(r);
      else byChapter.set(r.chapter, [r]);
    }

    const chapters: ChapterData[] = [];
    for (const [chapter, chapterRows] of byChapter) {
      const verses = chapterRows.map((r) => {
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
      chapters.push({ book, chapter, translation, verses });
    }
    chapters.sort((a, b) => a.chapter - b.chapter);

    return NextResponse.json(
      { book, translation, chapters },
      { headers: { "Cache-Control": BIBLE_CACHE_CONTROL } },
    );
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
