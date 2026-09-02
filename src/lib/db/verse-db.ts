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
  /** [start, end) character ranges in `text` spoken by Jesus, or null for a translation without this markup. */
  redLetter: unknown;
  /** Translator footnotes anchored within `text`, or null for a translation without them. */
  footnotes: unknown;
  /** Section heading displayed above this verse, or null except on the verse a section starts at. */
  heading: string | null;
  /** Secondary heading below `heading` (e.g. a speaker label), or null. */
  subheading: string | null;
  /** Rendered one verse per line (poetry) instead of folded into a flowing paragraph (prose). */
  poetic: boolean;
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
    select: {
      verse: true,
      verseEnd: true,
      label: true,
      text: true,
      redLetter: true,
      footnotes: true,
      heading: true,
      subheading: true,
      poetic: true,
    },
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

/**
 * The verse group text for each of several (book, chapter, verse) targets,
 * in one round trip instead of one query per target (used to batch-fetch
 * cross-reference / search-result previews, which can list a dozen refs at
 * once). `unnest` turns the three parallel arrays into a row set with each
 * target's original position, so a lateral lookup per row still uses the
 * Verse_pkey index exactly like `getVerseTextRow` does, and results come
 * back in input order.
 */
export async function getVerseTextRows(
  version: string,
  targets: { book: string; chapter: number; verse: number }[],
): Promise<(string | null)[]> {
  if (targets.length === 0) return [];
  const books = targets.map((t) => t.book);
  const chapters = targets.map((t) => t.chapter);
  const verses = targets.map((t) => t.verse);
  const rows = await prisma.$queryRaw<{ idx: bigint; text: string | null }[]>`
    SELECT input.idx, v.text
    FROM unnest(${books}::text[], ${chapters}::int[], ${verses}::int[])
      WITH ORDINALITY AS input(book, chapter, verse, idx)
    LEFT JOIN LATERAL (
      SELECT text FROM "Verse"
      WHERE version = ${version} AND book = input.book AND chapter = input.chapter
        AND verse <= input.verse AND "verseEnd" >= input.verse
      LIMIT 1
    ) v ON true
    ORDER BY input.idx`;
  const byIndex = new Map(rows.map((r) => [Number(r.idx) - 1, r.text]));
  return targets.map((_, i) => byIndex.get(i) ?? null);
}

export interface AvailableTranslation {
  id: string;
  language: string;
}

let translationsCache: { at: number; value: AvailableTranslation[] } | null = null;
const TRANSLATIONS_CACHE_MS = 60_000;

/**
 * Every distinct (version, language) pair actually present in the Verse
 * table. Called on every /api/chapter, /api/search, and /api/verse-text
 * request just to validate the `translation` param, so this is on the hot
 * path -- cached in-process for a minute (translations only change on a
 * reseed, and the CDN already caches responses built from this for a day
 * regardless, see BIBLE_CACHE_CONTROL).
 *
 * Postgres has no native "skip scan" (pre-v18), so a plain `DISTINCT
 * version` walks every row in the Verse_pkey index to find a handful of
 * distinct values -- ~60k rows costing ~175ms on this table. The recursive
 * CTE below emulates a skip scan: each step is an index lookup for "the
 * next version greater than the last one found", so cost scales with the
 * number of distinct versions, not the number of rows.
 */
export async function getAvailableTranslations(): Promise<AvailableTranslation[]> {
  if (translationsCache && Date.now() - translationsCache.at < TRANSLATIONS_CACHE_MS) {
    return translationsCache.value;
  }
  const rows = await prisma.$queryRaw<AvailableTranslation[]>`
    WITH RECURSIVE versions AS (
      (SELECT version FROM "Verse" ORDER BY version LIMIT 1)
      UNION ALL
      SELECT (SELECT version FROM "Verse" WHERE version > v.version ORDER BY version LIMIT 1)
      FROM versions v
      WHERE v.version IS NOT NULL
    )
    SELECT v.version AS id, (SELECT language FROM "Verse" WHERE version = v.version LIMIT 1) AS language
    FROM versions v
    WHERE v.version IS NOT NULL
    ORDER BY language ASC, id ASC`;
  translationsCache = { at: Date.now(), value: rows };
  return rows;
}

export interface StudyNoteRow {
  source: string;
  /** Anchor verse — the first verse of the passage this note covers. */
  verse: number;
  /** Last verse of the passage this note covers. */
  verseEnd: number;
  text: string;
}

/** Every study-note commentary entry anchored in a chapter, ordered by verse number. Translation-independent, like cross-refs. */
export function getStudyNotes(book: string, chapter: number): Promise<StudyNoteRow[]> {
  return prisma.studyNote.findMany({
    where: { book, chapter },
    orderBy: { verse: "asc" },
    select: { source: true, verse: true, verseEnd: true, text: true },
  });
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
