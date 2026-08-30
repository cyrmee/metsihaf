/** Supported translations. */
export type TranslationId = "AMH" | "NIV" | "ESV" | "NLT" | "NASB";

/** Language a translation is written in. Add a code here (and to the maps below) to support a new language. */
export type LanguageId = "en" | "am";

export interface Translation {
  id: TranslationId;
  label: string;
  name: string;
  /** "local" = bundled SQLite, "apibible" / "esv" = proxied licensed API */
  source: "local" | "apibible" | "esv";
  language: LanguageId;
}

/** Full language name, for display next to a book/chapter title. */
export const LANGUAGE_LABELS: Record<LanguageId, string> = {
  en: "English",
  am: "Amharic",
};

/** Font utility class for rendering a given language's script. Falls back to the default serif when absent. */
export const LANGUAGE_FONT_CLASS: Partial<Record<LanguageId, string>> = {
  am: "font-ethiopic",
};

export const TRANSLATIONS: Translation[] = [
  { id: "AMH", label: "AMH", name: "Amharic 1954", source: "local", language: "am" },
  {
    id: "NIV",
    label: "NIV",
    name: "New International Version",
    source: "apibible",
    language: "en",
  },
  { id: "ESV", label: "ESV", name: "English Standard Version", source: "esv", language: "en" },
  { id: "NLT", label: "NLT", name: "New Living Translation", source: "apibible", language: "en" },
  {
    id: "NASB",
    label: "NASB",
    name: "New American Standard Bible",
    source: "apibible",
    language: "en",
  },
];

export const TRANSLATION_BY_ID: Record<TranslationId, Translation> = Object.fromEntries(
  TRANSLATIONS.map((t) => [t.id, t]),
) as Record<TranslationId, Translation>;

/** API.Bible version IDs for the licensed translations. */
export const API_BIBLE_VERSION_IDS: Partial<Record<TranslationId, string>> = {
  // NIV
  NIV: "78a9f6124f344018-01",
  // NLT
  NLT: "65bfdebd704a8324-01",
  // NASB 1995
  NASB: "b8ee27bcd1cae43a-01",
};

export interface ChapterVerse {
  verse: number;
  text: string;
  /** Cross-reference targets, e.g. ["ISA.9.6", ...] */
  refs: string[];
  /** Last verse number this group covers, when the source combines verses under one number (e.g. 14 for a "13-14" group). */
  verseEnd?: number;
  /** Display label, e.g. "13-14" for a combined verse. Falls back to `verse` when absent. */
  label?: string;
}

export interface ChapterData {
  book: string;
  chapter: number;
  translation: TranslationId;
  verses: ChapterVerse[];
  /** Present when the translation's API key isn't configured. */
  unavailable?: string;
}
