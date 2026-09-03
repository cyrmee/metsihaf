/**
 * Local-only personal study data: bookmarks, highlights, notes, reading
 * history, and preferences. Everything lives in localStorage on this device.
 */

export type HighlightColor =
  "yellow" | "red" | "orange" | "brown" | "green" | "teal" | "blue" | "purple" | "pink";

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
  createdAt: number;
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
  createdAt: number;
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
  fontSize: "bible.fontSize",
  accentTheme: "bible.accentTheme",
  lineSpacing: "bible.lineSpacing",
  letterSpacing: "bible.letterSpacing",
  englishFont: "bible.englishFont",
  amharicFont: "bible.amharicFont",
  recentSearches: "bible.recentSearches",
  offlineDownloadedAt: "bible.offlineDownloadedAt",
  installPromptDismissed: "bible.installPromptDismissed",
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

/** Newest-first by creation time — the default order everywhere these are listed. */
function byCreatedAtDesc<T extends { createdAt: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => b.createdAt - a.createdAt);
}

export function getBookmarks(): Bookmark[] {
  return byCreatedAtDesc(read<Bookmark[]>(KEYS.bookmarks, []));
}

export function isBookmarked(ref: string): boolean {
  return getBookmarks().some((b) => b.ref === ref);
}

export function toggleBookmark(ref: string): boolean {
  const all = read<Bookmark[]>(KEYS.bookmarks, []);
  const idx = all.findIndex((b) => b.ref === ref);
  if (idx >= 0) {
    all.splice(idx, 1);
    write(KEYS.bookmarks, all);
    return false;
  }
  all.push({ ref, createdAt: Date.now() });
  write(KEYS.bookmarks, all);
  return true;
}

/** Adds a bookmark with an explicit creation time (e.g. importing one from the server) rather than "now". No-op if already bookmarked. */
export function addBookmark(ref: string, createdAt: number) {
  if (isBookmarked(ref)) return;
  const all = read<Bookmark[]>(KEYS.bookmarks, []);
  all.push({ ref, createdAt });
  write(KEYS.bookmarks, all);
}

export function removeBookmark(ref: string) {
  write(
    KEYS.bookmarks,
    getBookmarks().filter((b) => b.ref !== ref),
  );
}

// ---- Highlights ----

export function getHighlights(): Highlight[] {
  return byCreatedAtDesc(read<Highlight[]>(KEYS.highlights, []));
}

export function getHighlight(ref: string): Highlight | undefined {
  return getHighlights().find((h) => h.ref === ref);
}

export function setHighlight(ref: string, color: HighlightColor | null, createdAt?: number) {
  const all = read<Highlight[]>(KEYS.highlights, []);
  const existing = all.find((h) => h.ref === ref);
  const kept = all.filter((h) => h.ref !== ref);
  const next = color
    ? [...kept, { ref, color, createdAt: createdAt ?? existing?.createdAt ?? Date.now() }]
    : kept;
  write(KEYS.highlights, next);
}

// ---- Notes ----

export function getNotes(): Note[] {
  return byCreatedAtDesc(read<Note[]>(KEYS.notes, []));
}

export function getNote(ref: string): Note | undefined {
  return getNotes().find((n) => n.ref === ref);
}

export function setNote(ref: string, text: string, createdAt?: number) {
  const trimmed = text.trim();
  const all = read<Note[]>(KEYS.notes, []);
  const existing = all.find((n) => n.ref === ref);
  const kept = all.filter((n) => n.ref !== ref);
  const next = trimmed
    ? [
        ...kept,
        {
          ref,
          text: trimmed,
          createdAt: createdAt ?? existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        },
      ]
    : kept;
  write(KEYS.notes, next);
}

export function removeNote(ref: string) {
  write(
    KEYS.notes,
    getNotes().filter((n) => n.ref !== ref),
  );
}

// ---- Reading position ----

/** Mirrors the reading position into a cookie so the server can redirect `/` straight to it, skipping a client-side hop through a blank page. Kept minimal (no updatedAt) since the server only needs book/chapter. */
const POSITION_COOKIE = "bible.position";
const POSITION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writePositionCookie(pos: Omit<ReadingPosition, "updatedAt">) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify({ book: pos.book, chapter: pos.chapter }));
  document.cookie = `${POSITION_COOKIE}=${value}; path=/; max-age=${POSITION_COOKIE_MAX_AGE}; samesite=lax`;
}

export function getReadingPosition(): ReadingPosition | null {
  return read<ReadingPosition | null>(KEYS.position, null);
}

export function saveReadingPosition(pos: Omit<ReadingPosition, "updatedAt">) {
  write(KEYS.position, { ...pos, updatedAt: Date.now() });
  writePositionCookie(pos);
}

// ---- Preferences ----

const TRANSLATION_COOKIE = "bible.translation";

function writeTranslationCookie(id: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${TRANSLATION_COOKIE}=${id}; path=/; max-age=${POSITION_COOKIE_MAX_AGE}; samesite=lax`;
}

export function getPreferredTranslation(): string {
  return read<string>(KEYS.translation, "HSAB");
}

export function setPreferredTranslation(id: string) {
  write(KEYS.translation, id);
  writeTranslationCookie(id);
}

/**
 * Writes the translation cookie from whatever's already in localStorage,
 * without changing the stored value or notifying other listeners. Call this
 * once on mount: a preference saved before this cookie mirror existed (or
 * from before the user's browser had it) would otherwise never get one
 * written, since `setPreferredTranslation` only runs when the user actively
 * changes translation — leaving the server to fall back to the default
 * translation on every load until they happen to reselect their own.
 */
export function syncPreferredTranslationCookie() {
  writeTranslationCookie(getPreferredTranslation());
}

/**
 * Mirrors the display prefs that affect layout (size, spacing, font choice)
 * into one cookie, so the reading page can render with the reader's actual
 * settings from the first paint instead of a hardcoded default that then
 * visibly resizes/reflows once localStorage is read on mount.
 */
export interface ReadingDisplayPrefs {
  fontSize: number;
  lineSpacing: LineSpacing;
  letterSpacing: LetterSpacing;
  englishFont: EnglishFont;
  amharicFont: AmharicFont;
}

const READING_PREFS_COOKIE = "bible.readingPrefs";

function currentReadingDisplayPrefs(): ReadingDisplayPrefs {
  return {
    fontSize: getFontSize(),
    lineSpacing: getLineSpacing(),
    letterSpacing: getLetterSpacing(),
    englishFont: getEnglishFont(),
    amharicFont: getAmharicFont(),
  };
}

function writeReadingPrefsCookie() {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(currentReadingDisplayPrefs()));
  document.cookie = `${READING_PREFS_COOKIE}=${value}; path=/; max-age=${POSITION_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Backfills the reading-prefs cookie from whatever's already in localStorage
 * — same reasoning as syncPreferredTranslationCookie: settings saved before
 * this cookie mirror existed would otherwise never get one written.
 */
export function syncReadingPrefsCookie() {
  writeReadingPrefsCookie();
}

export const READING_PREFS_COOKIE_NAME = READING_PREFS_COOKIE;

const VALID_LINE_SPACINGS: readonly LineSpacing[] = ["tight", "normal", "relaxed"];
const VALID_LETTER_SPACINGS: readonly LetterSpacing[] = ["tight", "normal", "wide"];
const VALID_ENGLISH_FONTS: readonly EnglishFont[] = [
  "sourceSerif",
  "literata",
  "merriweather",
  "lora",
  "crimsonPro",
  "plexSans",
];
const VALID_AMHARIC_FONTS: readonly AmharicFont[] = ["notoSerif", "notoSans", "abyssinica"];

/**
 * Parses the reading-prefs cookie value (as read server-side from
 * `next/headers` cookies()) back into validated prefs, or null if it's
 * missing/malformed — never throws, so a stale or tampered cookie just falls
 * back to the reading page's own hardcoded defaults instead of erroring.
 */
export function parseReadingPrefsCookie(raw: string | undefined): ReadingDisplayPrefs | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<
      Record<keyof ReadingDisplayPrefs, unknown>
    >;
    const fontSize =
      typeof parsed.fontSize === "number" ? Math.min(28, Math.max(14, parsed.fontSize)) : null;
    const lineSpacing = VALID_LINE_SPACINGS.includes(parsed.lineSpacing as LineSpacing)
      ? (parsed.lineSpacing as LineSpacing)
      : null;
    const letterSpacing = VALID_LETTER_SPACINGS.includes(parsed.letterSpacing as LetterSpacing)
      ? (parsed.letterSpacing as LetterSpacing)
      : null;
    const englishFont = VALID_ENGLISH_FONTS.includes(parsed.englishFont as EnglishFont)
      ? (parsed.englishFont as EnglishFont)
      : null;
    const amharicFont = VALID_AMHARIC_FONTS.includes(parsed.amharicFont as AmharicFont)
      ? (parsed.amharicFont as AmharicFont)
      : null;
    if (fontSize === null || !lineSpacing || !letterSpacing || !englishFont || !amharicFont) {
      return null;
    }
    return { fontSize, lineSpacing, letterSpacing, englishFont, amharicFont };
  } catch {
    return null;
  }
}

export function getFontSize(): number {
  return read<number>(KEYS.fontSize, 18);
}

export function setFontSize(px: number) {
  write(KEYS.fontSize, Math.min(28, Math.max(14, px)));
  writeReadingPrefsCookie();
}

// ---- Data management ----

/** Erase bookmarks, highlights and notes on this device. Preferences are kept. */
export function clearStudyData() {
  write(KEYS.bookmarks, []);
  write(KEYS.highlights, []);
  write(KEYS.notes, []);
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
  writeReadingPrefsCookie();
}

export function getLetterSpacing(): LetterSpacing {
  return read<LetterSpacing>(KEYS.letterSpacing, "normal");
}

export function setLetterSpacing(spacing: LetterSpacing) {
  write(KEYS.letterSpacing, spacing);
  writeReadingPrefsCookie();
}

export function getEnglishFont(): EnglishFont {
  return read<EnglishFont>(KEYS.englishFont, "sourceSerif");
}

export function setEnglishFont(font: EnglishFont) {
  write(KEYS.englishFont, font);
  writeReadingPrefsCookie();
}

export function getAmharicFont(): AmharicFont {
  return read<AmharicFont>(KEYS.amharicFont, "notoSerif");
}

export function setAmharicFont(font: AmharicFont) {
  write(KEYS.amharicFont, font);
  writeReadingPrefsCookie();
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

// ---- Offline download & install prompt ----

/** When the full offline download last completed successfully, or null if it never has. */
export function getOfflineDownloadedAt(): number | null {
  return read<number | null>(KEYS.offlineDownloadedAt, null);
}

export function setOfflineDownloadedAt(at: number | null) {
  write(KEYS.offlineDownloadedAt, at);
}

/** Whether the user dismissed the "install & download for offline" banner. */
export function getInstallPromptDismissed(): boolean {
  return read<boolean>(KEYS.installPromptDismissed, false);
}

export function setInstallPromptDismissed(dismissed: boolean) {
  write(KEYS.installPromptDismissed, dismissed);
}
