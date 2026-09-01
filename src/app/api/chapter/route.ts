import { NextResponse } from "next/server";
import { BOOK_BY_ID } from "@/data/books";
import type { ChapterData, TranslationId } from "@/lib/bible";
import { getChapterRows } from "@/lib/db/amharic-db";
import { loadCrossrefs } from "@/lib/db/crossrefs";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { asIn, asPositiveInt } from "@/lib/validation";

export const runtime = "nodejs";

const TRANSLATIONS: TranslationId[] = ["AMH", "NIV", "ESV", "NLT", "NASB"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const translation = asIn(searchParams.get("translation"), TRANSLATIONS, "translation");
    const book = searchParams.get("book") ?? "";
    const chapter = asPositiveInt(searchParams.get("chapter"), "chapter");

    const bookMeta = BOOK_BY_ID[book];
    if (!bookMeta || chapter > bookMeta.chapters) {
      return NextResponse.json(
        { statusCode: 400, error: "Bad Request", message: `Unknown chapter: ${book} ${chapter}` },
        { status: 400 },
      );
    }

    if (translation !== "AMH") {
      const body: ChapterData = {
        book,
        chapter,
        translation,
        verses: [],
        unavailable: `${translation} isn't available yet.`,
      };
      return NextResponse.json(body);
    }

    const crossRefs = loadCrossrefs();
    const rows = getChapterRows(book, chapter);
    const verses = rows.map((r) => {
      const refs = new Set<string>();
      for (let v = r.verse; v <= r.verseEnd; v++) {
        for (const ref of crossRefs[`${book}.${chapter}.${v}`] ?? []) refs.add(ref);
      }
      return {
        verse: r.verse,
        verseEnd: r.verseEnd,
        label: r.label,
        text: r.text,
        refs: [...refs],
      };
    });

    const body: ChapterData = { book, chapter, translation, verses };
    return NextResponse.json(body);
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
