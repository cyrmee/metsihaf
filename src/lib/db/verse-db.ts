import "server-only";
import { prisma } from "@/lib/db/prisma";

export interface VerseRow {
  /** Verse number this group starts at — used for refs, anchors, and sorting. */
  verse: number;
  /** Same as `verse` for a normal verse; higher for a combined range like 13-14. */
  verseEnd: number;
  /** Display label: "13" or "13-14". */
  label: string;
  text: string;
}

/** All verse groups for a chapter of the given version, ordered by verse number. */
export function getChapterRows(
  version: string,
  book: string,
  chapter: number,
): Promise<VerseRow[]> {
  return prisma.verse.findMany({
    where: { version, book, chapter },
    orderBy: { verse: "asc" },
    select: { verse: true, verseEnd: true, label: true, text: true },
  });
}

/** The verse group containing a given verse number, or null if not found. */
export async function getVerseTextRow(
  version: string,
  book: string,
  chapter: number,
  verse: number,
): Promise<string | null> {
  const row = await prisma.verse.findFirst({
    where: { version, book, chapter, verse: { lte: verse }, verseEnd: { gte: verse } },
    select: { text: true },
  });
  return row?.text ?? null;
}

export interface AvailableTranslation {
  id: string;
  language: string;
}

/** Every distinct (version, language) pair actually present in the Verse table. */
export async function getAvailableTranslations(): Promise<AvailableTranslation[]> {
  const rows = await prisma.verse.findMany({
    distinct: ["version"],
    select: { version: true, language: true },
    orderBy: [{ language: "asc" }, { version: "asc" }],
  });
  return rows.map((r) => ({ id: r.version, language: r.language }));
}

interface SearchRow {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

/** Full-text search over a version's text, optionally scoped to one book. */
export async function searchRows(
  version: string,
  query: string,
  bookFilter?: string,
): Promise<{ ref: string; text: string }[]> {
  const rows = bookFilter
    ? await prisma.$queryRaw<SearchRow[]>`
        SELECT book, chapter, verse, text FROM "Verse"
        WHERE version = ${version}
          AND to_tsvector('simple', text) @@ phraseto_tsquery('simple', ${query})
          AND book = ${bookFilter}
        LIMIT 200`
    : await prisma.$queryRaw<SearchRow[]>`
        SELECT book, chapter, verse, text FROM "Verse"
        WHERE version = ${version}
          AND to_tsvector('simple', text) @@ phraseto_tsquery('simple', ${query})
        LIMIT 200`;
  return rows.map((r) => ({ ref: `${r.book}.${r.chapter}.${r.verse}`, text: r.text }));
}
