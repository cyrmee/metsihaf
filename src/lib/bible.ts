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

/** Full translation name, for display next to its abbreviation in the version picker. Falls back to just the abbreviation for a version not listed here. */
export const TRANSLATION_NAMES: Partial<Record<string, string>> = {
  BSB: "Berean Standard Bible",
  HSAB: "Amharic Bible (1954)",
};

/** Font utility class for rendering a given language's script. Falls back to the default serif when absent. */
export const LANGUAGE_FONT_CLASS: Partial<Record<string, string>> = {
  am: "font-ethiopic",
};

/** A translator footnote anchored to a character offset in a verse's `text`. */
export interface Footnote {
  /** Character offset in `text` the note is anchored to. */
  at: number;
  note: string;
}

/** A study-note commentary entry anchored at a verse, covering it through `verseEnd`. Translation-independent — the same for every version. */
export interface StudyNote {
  verseEnd: number;
  text: string;
  /** Commentary this note comes from, e.g. "matthew-henry". */
  source: string;
}

export interface ChapterVerse {
  verse: number;
  text: string;
  /** Cross-reference targets, e.g. ["ISA.9.6", ...] */
  refs: string[];
  /** Last verse number this group covers, when the source combines verses under one number (e.g. 14 for a "13-14" group). */
  verseEnd?: number;
  /** Display label, e.g. "13-14" for a combined verse. Falls back to `verse` when absent. */
  label?: string;
  /** [start, end) character ranges in `text` spoken by Jesus — present only for translations whose source marks this (e.g. BSB). */
  redLetter?: [number, number][];
  /** Translator footnotes anchored within `text` — present only for translations whose source has them. */
  footnotes?: Footnote[];
  /** Section heading displayed above this verse — present only on the verse a section starts at. */
  heading?: string;
  /** Secondary heading below `heading` (e.g. a speaker label in Song of Solomon). */
  subheading?: string;
  /** Rendered one verse per line (poetry) instead of folded into a flowing paragraph (prose) — from the source's own paragraph markup. */
  poetic?: boolean;
  /**
   * Commentary note anchored at this verse — present only on the verse a
   * note's passage starts at. Not populated by /api/chapter (which is
   * translation-scoped); merged in client-side from a separate
   * ChapterStudyNotes fetch, kept in its own cache entry since the same
   * notes apply across every translation.
   */
  studyNote?: StudyNote;
}

export interface ChapterData {
  book: string;
  chapter: number;
  translation: TranslationId;
  verses: ChapterVerse[];
}

/** Study-note commentary for a chapter, fetched independently of verse text — see /api/study-notes. */
export interface ChapterStudyNotes {
  book: string;
  chapter: number;
  notes: (StudyNote & { verse: number })[];
}
