import { NextResponse } from "next/server";
import { BOOK_BY_ID } from "@/data/books";
import type { ChapterData, Footnote } from "@/lib/bible";
import { BIBLE_CACHE_CONTROL } from "@/lib/cache-control";
import { loadCrossrefs } from "@/lib/db/crossrefs";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { getAvailableTranslations, getChapterRows, getStudyNotes } from "@/lib/db/verse-db";
import { asIn, asPositiveInt } from "@/lib/validation";

export const runtime = "nodejs";

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
    const chapter = asPositiveInt(searchParams.get("chapter"), "chapter");

    const bookMeta = BOOK_BY_ID[book];
    if (!bookMeta || chapter > bookMeta.chapters) {
      return NextResponse.json(
        { statusCode: 400, error: "Bad Request", message: `Unknown chapter: ${book} ${chapter}` },
        { status: 400 },
      );
    }

    const crossRefs = loadCrossrefs();
    const [rows, studyNotes] = await Promise.all([
      getChapterRows(translation, book, chapter),
      getStudyNotes(book, chapter),
    ]);
    const studyNoteByVerse = new Map(studyNotes.map((n) => [n.verse, n]));
    const verses = rows.map((r) => {
      const refs = new Set<string>();
      for (let v = r.verse; v <= r.verseEnd; v++) {
        for (const ref of crossRefs[`${book}.${chapter}.${v}`] ?? []) refs.add(ref);
      }
      const redLetter = r.redLetter as [number, number][] | null;
      const footnotes = r.footnotes as Footnote[] | null;
      const studyNote = studyNoteByVerse.get(r.verse);
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
        ...(studyNote
          ? { studyNote: { verseEnd: studyNote.verseEnd, text: studyNote.text, source: studyNote.source } }
          : {}),
      };
    });

    const body: ChapterData = { book, chapter, translation, verses };
    return NextResponse.json(body, { headers: { "Cache-Control": BIBLE_CACHE_CONTROL } });
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
