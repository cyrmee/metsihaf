import "server-only";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export interface AmharicVerseRow {
  /** Verse number this group starts at — used for refs, anchors, and sorting. */
  verse: number;
  /** Same as `verse` for a normal verse; higher for a combined range like 13-14. */
  verseEnd: number;
  /** Display label: "13" or "13-14". */
  label: string;
  text: string;
}

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(path.join(process.cwd(), "src/data/amharic.db"), { readOnly: true });
  }
  return db;
}

/** All verse groups for a chapter, ordered by verse number. */
export function getChapterRows(book: string, chapter: number): AmharicVerseRow[] {
  const rows = getDb()
    .prepare(
      "SELECT verse, verse_end AS verseEnd, label, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse",
    )
    .all(book, chapter);
  return rows as unknown as AmharicVerseRow[];
}

/** The verse group containing a given verse number, or null if not found. */
export function getVerseTextRow(book: string, chapter: number, verse: number): string | null {
  const row = getDb()
    .prepare(
      "SELECT text FROM verses WHERE book = ? AND chapter = ? AND ? BETWEEN verse AND verse_end",
    )
    .get(book, chapter, verse) as { text: string } | undefined;
  return row?.text ?? null;
}

/** Full-text search over the Amharic Bible, optionally scoped to one book. */
export function searchRows(query: string, bookFilter?: string): { ref: string; text: string }[] {
  const sql = bookFilter
    ? `SELECT v.book, v.chapter, v.verse, v.text FROM verses_fts f
       JOIN verses v ON v.rowid = f.rowid
       WHERE verses_fts MATCH ? AND v.book = ? LIMIT 200`
    : `SELECT v.book, v.chapter, v.verse, v.text FROM verses_fts f
       JOIN verses v ON v.rowid = f.rowid
       WHERE verses_fts MATCH ? LIMIT 200`;
  // Quote as an FTS5 phrase so punctuation/operators in user input can't break the MATCH syntax.
  const ftsQuery = `"${query.replace(/"/g, '""')}"`;
  const params = bookFilter ? [ftsQuery, bookFilter] : [ftsQuery];
  const rows = getDb()
    .prepare(sql)
    .all(...params) as unknown as { book: string; chapter: number; verse: number; text: string }[];
  return rows.map((r) => ({ ref: `${r.book}.${r.chapter}.${r.verse}`, text: r.text }));
}
