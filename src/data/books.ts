import type { LanguageId } from "@/lib/bible";

/**
 * Bible book metadata: 66 books in Protestant canon order.
 * - id: USFM code (also used by API.Bible)
 * - nameEn / nameAm: display names
 * - chapters: chapter count
 * - testament: OT | NT
 */
export interface BibleBook {
  id: string;
  nameEn: string;
  nameAm: string;
  chapters: number;
  testament: "OT" | "NT";
}

export const BOOKS: BibleBook[] = [
  { id: "GEN", nameEn: "Genesis", nameAm: "ኦሪት ዘፍጥረት", chapters: 50, testament: "OT" },
  { id: "EXO", nameEn: "Exodus", nameAm: "ኦሪት ዘጸአት", chapters: 40, testament: "OT" },
  { id: "LEV", nameEn: "Leviticus", nameAm: "ኦሪት ዘሌዋውያን", chapters: 27, testament: "OT" },
  { id: "NUM", nameEn: "Numbers", nameAm: "ኦሪት ዘኍልቍ", chapters: 36, testament: "OT" },
  { id: "DEU", nameEn: "Deuteronomy", nameAm: "ኦሪት ዘዳግም", chapters: 34, testament: "OT" },
  { id: "JOS", nameEn: "Joshua", nameAm: "መጽሐፈ ኢያሱ ወልደ ነዌ", chapters: 24, testament: "OT" },
  { id: "JDG", nameEn: "Judges", nameAm: "መጽሐፈ መሣፍንት", chapters: 21, testament: "OT" },
  { id: "RUT", nameEn: "Ruth", nameAm: "መጽሐፈ ሩት", chapters: 4, testament: "OT" },
  { id: "1SA", nameEn: "1 Samuel", nameAm: "መጽሐፈ ሳሙኤል ቀዳማዊ", chapters: 31, testament: "OT" },
  { id: "2SA", nameEn: "2 Samuel", nameAm: "መጽሐፈ ሳሙኤል ካል", chapters: 24, testament: "OT" },
  { id: "1KI", nameEn: "1 Kings", nameAm: "መጽሐፈ ነገሥት ቀዳማዊ", chapters: 22, testament: "OT" },
  { id: "2KI", nameEn: "2 Kings", nameAm: "መጽሐፈ ነገሥት ካልዕ", chapters: 25, testament: "OT" },
  { id: "1CH", nameEn: "1 Chronicles", nameAm: "መጽሐፈ ዜና መዋዕል ቀዳማዊ", chapters: 29, testament: "OT" },
  { id: "2CH", nameEn: "2 Chronicles", nameAm: "መጽሐፈ ዜና መዋዕል ካልዕ", chapters: 36, testament: "OT" },
  { id: "EZR", nameEn: "Ezra", nameAm: "መጽሐፈ ዕዝራ", chapters: 10, testament: "OT" },
  { id: "NEH", nameEn: "Nehemiah", nameAm: "መጽሐፈ ነህምያ", chapters: 13, testament: "OT" },
  { id: "EST", nameEn: "Esther", nameAm: "መጽሐፈ አስቴር", chapters: 10, testament: "OT" },
  { id: "JOB", nameEn: "Job", nameAm: "መጽሐፈ ኢዮብ", chapters: 42, testament: "OT" },
  { id: "PSA", nameEn: "Psalms", nameAm: "መዝሙረ ዳዊት", chapters: 150, testament: "OT" },
  { id: "PRO", nameEn: "Proverbs", nameAm: "መጽሐፈ ምሳሌ", chapters: 31, testament: "OT" },
  { id: "ECC", nameEn: "Ecclesiastes", nameAm: "መጽሐፈ መክብብ", chapters: 12, testament: "OT" },
  { id: "SNG", nameEn: "Song of Solomon", nameAm: "መኃልየ መኃልይ ዘሰሎሞን", chapters: 8, testament: "OT" },
  { id: "ISA", nameEn: "Isaiah", nameAm: "ትንቢተ ኢሳይያስ", chapters: 66, testament: "OT" },
  { id: "JER", nameEn: "Jeremiah", nameAm: "ትንቢተ ኤርምያስ", chapters: 52, testament: "OT" },
  { id: "LAM", nameEn: "Lamentations", nameAm: "ሰቆቃው ኤርምያስ", chapters: 5, testament: "OT" },
  { id: "EZK", nameEn: "Ezekiel", nameAm: "ትንቢተ ሕዝቅኤል", chapters: 48, testament: "OT" },
  { id: "DAN", nameEn: "Daniel", nameAm: "ትንቢተ ዳንኤል", chapters: 12, testament: "OT" },
  { id: "HOS", nameEn: "Hosea", nameAm: "ትንቢተ ሆሴዕ", chapters: 14, testament: "OT" },
  { id: "JOL", nameEn: "Joel", nameAm: "ትንቢተ ኢዮኤል", chapters: 3, testament: "OT" },
  { id: "AMO", nameEn: "Amos", nameAm: "ትንቢተ አሞጽ", chapters: 9, testament: "OT" },
  { id: "OBA", nameEn: "Obadiah", nameAm: "ትንቢተ አብድዩ", chapters: 1, testament: "OT" },
  { id: "JON", nameEn: "Jonah", nameAm: "ትንቢተ ዮናስ", chapters: 4, testament: "OT" },
  { id: "MIC", nameEn: "Micah", nameAm: "ትንቢተ ሚክያስ", chapters: 7, testament: "OT" },
  { id: "NAM", nameEn: "Nahum", nameAm: "ትንቢተ ናሆም", chapters: 3, testament: "OT" },
  { id: "HAB", nameEn: "Habakkuk", nameAm: "ትንቢተ ዕንባቆም", chapters: 3, testament: "OT" },
  { id: "ZEP", nameEn: "Zephaniah", nameAm: "ትንቢተ ሶፎንያስ", chapters: 3, testament: "OT" },
  { id: "HAG", nameEn: "Haggai", nameAm: "ትንቢተ ሐጌ", chapters: 2, testament: "OT" },
  { id: "ZEC", nameEn: "Zechariah", nameAm: "ትንቢተ ዘካርያስ", chapters: 14, testament: "OT" },
  { id: "MAL", nameEn: "Malachi", nameAm: "ትንቢተ ሚልክያ", chapters: 4, testament: "OT" },
  { id: "MAT", nameEn: "Matthew", nameAm: "የማቴዎስ ወንጌል", chapters: 28, testament: "NT" },
  { id: "MRK", nameEn: "Mark", nameAm: "የማርቆስ ወንጌል", chapters: 16, testament: "NT" },
  { id: "LUK", nameEn: "Luke", nameAm: "የሉቃስ ወንጌል", chapters: 24, testament: "NT" },
  { id: "JHN", nameEn: "John", nameAm: "የዮሐንስ ወንጌል", chapters: 21, testament: "NT" },
  { id: "ACT", nameEn: "Acts", nameAm: "የሐዋርያት ሥራ", chapters: 28, testament: "NT" },
  { id: "ROM", nameEn: "Romans", nameAm: "ወደ ሮሜ ሰዎች", chapters: 16, testament: "NT" },
  { id: "1CO", nameEn: "1 Corinthians", nameAm: "1ኛ ወደ ቆሮንቶስ ሰዎች", chapters: 16, testament: "NT" },
  { id: "2CO", nameEn: "2 Corinthians", nameAm: "2ኛ ወደ ቆሮንቶስ ሰዎች", chapters: 13, testament: "NT" },
  { id: "GAL", nameEn: "Galatians", nameAm: "ወደ ገላትያ ሰዎች", chapters: 6, testament: "NT" },
  { id: "EPH", nameEn: "Ephesians", nameAm: "ወደ ኤፌሶን ሰዎች", chapters: 6, testament: "NT" },
  { id: "PHP", nameEn: "Philippians", nameAm: "ወደ ፊልጵስዩስ ሰዎች", chapters: 4, testament: "NT" },
  { id: "COL", nameEn: "Colossians", nameAm: "ወደ ቆላስይስ ሰዎች", chapters: 4, testament: "NT" },
  { id: "1TH", nameEn: "1 Thessalonians", nameAm: "1ኛ ወደ ተሰሎንቄ ሰዎች", chapters: 5, testament: "NT" },
  { id: "2TH", nameEn: "2 Thessalonians", nameAm: "2ኛ ወደ ተሰሎንቄ ሰዎች", chapters: 3, testament: "NT" },
  { id: "1TI", nameEn: "1 Timothy", nameAm: "1ኛ ወደ ጢሞቴዎስ", chapters: 6, testament: "NT" },
  { id: "2TI", nameEn: "2 Timothy", nameAm: "2ኛ ወደ ጢሞቴዎስ", chapters: 4, testament: "NT" },
  { id: "TIT", nameEn: "Titus", nameAm: "ወደ ቲቶ", chapters: 3, testament: "NT" },
  { id: "PHM", nameEn: "Philemon", nameAm: "ወደ ፊልሞና", chapters: 1, testament: "NT" },
  { id: "HEB", nameEn: "Hebrews", nameAm: "ወደ ዕብራውያን", chapters: 13, testament: "NT" },
  { id: "JAS", nameEn: "James", nameAm: "የያዕቆብ መልእክት", chapters: 5, testament: "NT" },
  { id: "1PE", nameEn: "1 Peter", nameAm: "1ኛ የጴጥሮስ መልእክት", chapters: 5, testament: "NT" },
  { id: "2PE", nameEn: "2 Peter", nameAm: "2ኛ የጴጥሮስ መልእክት", chapters: 3, testament: "NT" },
  { id: "1JN", nameEn: "1 John", nameAm: "1ኛ የዮሐንስ መልእክት", chapters: 5, testament: "NT" },
  { id: "2JN", nameEn: "2 John", nameAm: "2ኛ የዮሐንስ መልእክት", chapters: 1, testament: "NT" },
  { id: "3JN", nameEn: "3 John", nameAm: "3ኛ የዮሐንስ መልእክት", chapters: 1, testament: "NT" },
  { id: "JUD", nameEn: "Jude", nameAm: "የይሁዳ መልእክት", chapters: 1, testament: "NT" },
  { id: "REV", nameEn: "Revelation", nameAm: "የዮሐንስ ራእይ", chapters: 22, testament: "NT" },
];

export const BOOK_BY_ID: Record<string, BibleBook> = Object.fromEntries(
  BOOKS.map((b) => [b.id, b]),
);

export function bookIndex(id: string): number {
  return BOOKS.findIndex((b) => b.id === id);
}

/** Book title in a given language. Add a branch here (and a nameXx field above) to support a new language. */
export function bookName(book: BibleBook, language: LanguageId): string {
  return language === "am" ? book.nameAm : book.nameEn;
}

/** Parse "GEN.1.1" into parts, or null if invalid. */
export function parseVerseRef(
  ref: string,
): { book: string; chapter: number; verse: number } | null {
  const parts = ref.split(".");
  if (parts.length !== 3) return null;
  const bookId = parts[0] ?? "";
  const book = BOOK_BY_ID[bookId];
  if (!book) return null;
  const chapter = Number(parts[1]);
  const verse = Number(parts[2]);
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
  if (chapter < 1 || chapter > book.chapters || verse < 1) return null;
  return { book: bookId, chapter, verse };
}

/** Format "GEN.1.1" as "Genesis 1:1" (or in another language, e.g. "ኦሪት ዘፍጥረት 1:1"). */
export function formatRef(ref: string, lang: LanguageId = "en"): string {
  const p = parseVerseRef(ref);
  if (!p) return ref;
  const book = BOOK_BY_ID[p.book];
  if (!book) return ref;
  return `${bookName(book, lang)} ${p.chapter}:${p.verse}`;
}

/** Next/previous chapter navigation across book boundaries. */
export function neighborChapter(
  bookId: string,
  chapter: number,
  dir: 1 | -1,
): { book: string; chapter: number } | null {
  const idx = bookIndex(bookId);
  const book = idx >= 0 ? BOOKS[idx] : undefined;
  if (!book) return null;
  const target = chapter + dir;
  if (target >= 1 && target <= book.chapters) return { book: bookId, chapter: target };
  const nextBook = BOOKS[idx + dir];
  if (!nextBook) return null;
  return { book: nextBook.id, chapter: dir === 1 ? 1 : nextBook.chapters };
}
