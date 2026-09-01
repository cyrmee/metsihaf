/**
 * Local-only personal study data: bookmarks, highlights, notes, reading
 * history, and preferences. Everything lives in localStorage on this device.
 */

export type HighlightColor =
  "yellow" | "red" | "orange" | "brown" | "green" | "teal" | "blue" | "purple" | "pink";

export type VerseViewMode = "line" | "paragraph";

export type AccentTheme =
  "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "pink" | "brown";

export type LineSpacing = "tight" | "normal" | "relaxed";

export type LetterSpacing = "tight" | "normal" | "wide";

export type EnglishFont =
  "sourceSerif" | "literata" | "merriweather" | "lora" | "crimsonPro" | "plexSans";

export type AmharicFont = "notoSerif" | "notoSans" | "abyssinica";

/** English scripture-text font choices — a mix of literary and screen-optimized serifs, plus one clean sans-serif. */
export const ENGLISH_FONT_STACKS: Record<EnglishFont, string> = {
  sourceSerif: '"Source Serif 4", ui-serif, Georgia, serif',
  literata: '"Literata", ui-serif, Georgia, serif',
  merriweather: '"Merriweather", ui-serif, Georgia, serif',
  lora: '"Lora", ui-serif, Georgia, serif',
  crimsonPro: '"Crimson Pro", ui-serif, Georgia, serif',
  plexSans: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
};

/** Amharic scripture-text font choices — a clean Ethiopic serif (default), a modern sans, and the traditional calligraphic style used in printed scripture. */
export const AMHARIC_FONT_STACKS: Record<AmharicFont, string> = {
  notoSerif: '"Noto Serif Ethiopic", serif',
  notoSans: '"Noto Sans Ethiopic", sans-serif',
  abyssinica: '"Abyssinica SIL", serif',
};

/** Actual CSS values for each line-spacing step, applied over the base scripture line-height. */
export const LINE_SPACING_VALUES: Record<LineSpacing, number> = {
  tight: 1.5,
  normal: 1.9,
  relaxed: 2.3,
};

/** Actual CSS values for each letter-spacing step, applied over the base scripture text. */
export const LETTER_SPACING_VALUES: Record<LetterSpacing, string> = {
  tight: "0em",
  normal: "0.01em",
  wide: "0.04em",
};

export interface Bookmark {
  ref: string; // "GEN.1.1"
  createdAt: number;
}

export interface Highlight {
  /** A composite `"TRANSLATION:BOOK.CHAPTER.VERSE"` key — see {@link highlightRef}. */
  ref: string;
  color: HighlightColor;
}

/**
 * Highlights are scoped per translation (unlike bookmarks and notes, which
 * are about the passage itself): the same verse can be highlighted
 * independently in each version you read it in. Build the composite key
 * this way rather than storing `translation` as a separate field, so the
 * existing `ref`-keyed storage (and its remote sync, which treats `ref` as
 * an opaque string) needs no schema change.
 */
export function highlightRef(translation: string, ref: string): string {
  return `${translation}:${ref}`;
}

/** Splits a highlight's composite key back into its translation and plain verse ref. */
export function parseHighlightRef(key: string): { translation: string; ref: string } {
  const i = key.indexOf(":");
  if (i === -1) return { translation: "", ref: key };
  return { translation: key.slice(0, i), ref: key.slice(i + 1) };
}

export interface Note {
  ref: string;
  text: string;
  updatedAt: number;
}

export interface ReadingPosition {
  book: string;
  chapter: number;
  translation: string;
  updatedAt: number;
}

const KEYS = {
  bookmarks: "bible.bookmarks",
  highlights: "bible.highlights",
  notes: "bible.notes",
  position: "bible.position",
  translation: "bible.translation",
  darkMode: "bible.darkMode",
  fontSize: "bible.fontSize",
  verseView: "bible.verseView",
  accentTheme: "bible.accentTheme",
  lineSpacing: "bible.lineSpacing",
  letterSpacing: "bible.letterSpacing",
  englishFont: "bible.englishFont",
  amharicFont: "bible.amharicFont",
  recentSearches: "bible.recentSearches",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("bible-store-change", { detail: { key } }));
}

/** Re-run the callback whenever study data changes (any tab of this page). */
export function onStoreChange(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("bible-store-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("bible-store-change", handler);
    window.removeEventListener("storage", handler);
  };
}

// ---- Bookmarks ----

export function getBookmarks(): Bookmark[] {
  return read<Bookmark[]>(KEYS.bookmarks, []);
}

export function isBookmarked(ref: string): boolean {
  return getBookmarks().some((b) => b.ref === ref);
}

export function toggleBookmark(ref: string): boolean {
  const all = getBookmarks();
  const idx = all.findIndex((b) => b.ref === ref);
  if (idx >= 0) {
    all.splice(idx, 1);
    write(KEYS.bookmarks, all);
    return false;
  }
  all.unshift({ ref, createdAt: Date.now() });
  write(KEYS.bookmarks, all);
  return true;
}

export function removeBookmark(ref: string) {
  write(
    KEYS.bookmarks,
    getBookmarks().filter((b) => b.ref !== ref),
  );
}

// ---- Highlights ----

export function getHighlights(): Highlight[] {
  return read<Highlight[]>(KEYS.highlights, []);
}

export function getHighlight(ref: string): Highlight | undefined {
  return getHighlights().find((h) => h.ref === ref);
}

export function setHighlight(ref: string, color: HighlightColor | null) {
  let all = getHighlights().filter((h) => h.ref !== ref);
  if (color) all = [...all, { ref, color }];
  write(KEYS.highlights, all);
}

// ---- Notes ----

export function getNotes(): Note[] {
  return read<Note[]>(KEYS.notes, []);
}

export function getNote(ref: string): Note | undefined {
  return getNotes().find((n) => n.ref === ref);
}

export function setNote(ref: string, text: string) {
  const trimmed = text.trim();
  let all = getNotes().filter((n) => n.ref !== ref);
  if (trimmed) all = [...all, { ref, text: trimmed, updatedAt: Date.now() }];
  write(KEYS.notes, all);
}

export function removeNote(ref: string) {
  write(
    KEYS.notes,
    getNotes().filter((n) => n.ref !== ref),
  );
}

// ---- Reading position ----

export function getReadingPosition(): ReadingPosition | null {
  return read<ReadingPosition | null>(KEYS.position, null);
}

export function saveReadingPosition(pos: Omit<ReadingPosition, "updatedAt">) {
  write(KEYS.position, { ...pos, updatedAt: Date.now() });
}

// ---- Preferences ----

export function getPreferredTranslation(): string {
  return read<string>(KEYS.translation, "HSAB");
}

export function setPreferredTranslation(id: string) {
  write(KEYS.translation, id);
}

export function getDarkMode(): boolean {
  return read<boolean>(KEYS.darkMode, false);
}

export function setDarkMode(on: boolean) {
  write(KEYS.darkMode, on);
}

export function getFontSize(): number {
  return read<number>(KEYS.fontSize, 18);
}

export function setFontSize(px: number) {
  write(KEYS.fontSize, Math.min(28, Math.max(14, px)));
}

// ---- Data management ----

/** Erase bookmarks, highlights and notes on this device. Preferences are kept. */
export function clearStudyData() {
  write(KEYS.bookmarks, []);
  write(KEYS.highlights, []);
  write(KEYS.notes, []);
}

export function getVerseView(): VerseViewMode {
  return read<VerseViewMode>(KEYS.verseView, "line");
}

export function setVerseView(mode: VerseViewMode) {
  write(KEYS.verseView, mode);
}

export function getAccentTheme(): AccentTheme {
  return read<AccentTheme>(KEYS.accentTheme, "red");
}

export function setAccentTheme(theme: AccentTheme) {
  write(KEYS.accentTheme, theme);
}

export function getLineSpacing(): LineSpacing {
  return read<LineSpacing>(KEYS.lineSpacing, "normal");
}

export function setLineSpacing(spacing: LineSpacing) {
  write(KEYS.lineSpacing, spacing);
}

export function getLetterSpacing(): LetterSpacing {
  return read<LetterSpacing>(KEYS.letterSpacing, "normal");
}

export function setLetterSpacing(spacing: LetterSpacing) {
  write(KEYS.letterSpacing, spacing);
}

export function getEnglishFont(): EnglishFont {
  return read<EnglishFont>(KEYS.englishFont, "sourceSerif");
}

export function setEnglishFont(font: EnglishFont) {
  write(KEYS.englishFont, font);
}

export function getAmharicFont(): AmharicFont {
  return read<AmharicFont>(KEYS.amharicFont, "notoSerif");
}

export function setAmharicFont(font: AmharicFont) {
  write(KEYS.amharicFont, font);
}

// ---- Recent searches ----

export interface RecentSearch {
  query: string;
  translation: string;
  at: number;
}

const MAX_RECENT_SEARCHES = 8;

export function getRecentSearches(): RecentSearch[] {
  return read<RecentSearch[]>(KEYS.recentSearches, []);
}

export function addRecentSearch(query: string, translation: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const rest = getRecentSearches().filter(
    (r) => !(r.query === trimmed && r.translation === translation),
  );
  write(
    KEYS.recentSearches,
    [{ query: trimmed, translation, at: Date.now() }, ...rest].slice(0, MAX_RECENT_SEARCHES),
  );
}

export function removeRecentSearch(query: string, translation: string) {
  write(
    KEYS.recentSearches,
    getRecentSearches().filter((r) => !(r.query === query && r.translation === translation)),
  );
}

export function clearRecentSearches() {
  write(KEYS.recentSearches, []);
}
