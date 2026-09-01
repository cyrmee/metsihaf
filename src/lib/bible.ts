/** A specific Bible version/translation, as it exists in the Verse table. */
export type TranslationId = string;

/** Language a version is written in — whatever code is stored alongside it in the Verse table. */
export type LanguageId = string;

export interface Translation {
  id: TranslationId;
  language: LanguageId;
}

/** Full language name, for display next to a book/chapter title. Falls back to the raw code for a language not listed here. */
export const LANGUAGE_LABELS: Partial<Record<string, string>> = {
  en: "English",
  am: "Amharic",
};

/** Font utility class for rendering a given language's script. Falls back to the default serif when absent. */
export const LANGUAGE_FONT_CLASS: Partial<Record<string, string>> = {
  am: "font-ethiopic",
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
}
