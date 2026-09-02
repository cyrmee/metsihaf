"use server";

import { prisma } from "@/lib/db/prisma";
import { requireUser, UnauthenticatedError } from "@/lib/auth/require-user";
import { toApiError } from "@/lib/db/handle-prisma-error";
import {
  asIn,
  asNonEmptyString,
  asOptionalBoolean,
  asOptionalIn,
  asOptionalInt,
  asOptionalString,
  asPositiveInt,
} from "@/lib/validation";
import type { AccentTheme, HighlightColor, LetterSpacing, LineSpacing } from "@prisma/client";

export type SyncResult<T> = { ok: boolean; body: T | null };

const HIGHLIGHT_COLORS: HighlightColor[] = [
  "yellow",
  "red",
  "orange",
  "brown",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
];
const ACCENT_THEMES: AccentTheme[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "brown",
];
const LINE_SPACINGS: LineSpacing[] = ["tight", "normal", "relaxed"];
const LETTER_SPACINGS: LetterSpacing[] = ["tight", "normal", "wide"];

const PREFERENCE_DEFAULTS = {
  darkMode: false,
  fontSize: 18,
  accentTheme: "red" as AccentTheme,
  lineSpacing: "normal" as LineSpacing,
  letterSpacing: "normal" as LetterSpacing,
  showVerseSelector: false,
};

async function withUser<T>(fn: (userId: string) => Promise<T>): Promise<SyncResult<T>> {
  try {
    const user = await requireUser();
    const body = await fn(user.id);
    return { ok: true, body };
  } catch (exception) {
    if (exception instanceof UnauthenticatedError) return { ok: false, body: null };
    toApiError(exception); // logged/normalized; nothing more to do without an HTTP layer
    return { ok: false, body: null };
  }
}

// ---- Bookmarks ----

export async function getBookmarks(): Promise<SyncResult<{ ref: string; createdAt: number }[]>> {
  return withUser(async (userId) => {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return bookmarks.map((b) => ({ ref: b.ref, createdAt: b.createdAt.getTime() }));
  });
}

export async function upsertBookmark(ref: string): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    const validRef = asNonEmptyString(ref, "ref");
    await prisma.bookmark.upsert({
      where: { userId_ref: { userId, ref: validRef } },
      create: { userId, ref: validRef },
      update: {},
    });
    return null;
  });
}

export async function deleteBookmark(ref: string): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    await prisma.bookmark.deleteMany({ where: { userId, ref } });
    return null;
  });
}

// ---- Highlights ----

export async function getHighlights(): Promise<
  SyncResult<{ ref: string; color: HighlightColor }[]>
> {
  return withUser(async (userId) => {
    const highlights = await prisma.highlight.findMany({ where: { userId } });
    return highlights.map((h) => ({ ref: h.ref, color: h.color }));
  });
}

/** Upserts a highlight, or deletes it if `color` is null/undefined. */
export async function upsertOrDeleteHighlight(
  ref: string,
  color: HighlightColor | null | undefined,
): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    const validRef = asNonEmptyString(ref, "ref");
    if (color === null || color === undefined) {
      await prisma.highlight.deleteMany({ where: { userId, ref: validRef } });
      return null;
    }
    const validColor = asIn(color, HIGHLIGHT_COLORS, "color");
    await prisma.highlight.upsert({
      where: { userId_ref: { userId, ref: validRef } },
      create: { userId, ref: validRef, color: validColor },
      update: { color: validColor },
    });
    return null;
  });
}

// ---- Notes ----

export async function getNotes(): Promise<
  SyncResult<{ ref: string; text: string; updatedAt: number }[]>
> {
  return withUser(async (userId) => {
    const notes = await prisma.note.findMany({ where: { userId } });
    return notes.map((n) => ({ ref: n.ref, text: n.text, updatedAt: n.updatedAt.getTime() }));
  });
}

/** Upserts a note, or deletes it if the trimmed text is empty. */
export async function upsertOrDeleteNote(
  ref: string,
  text: string | undefined,
): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    const validRef = asNonEmptyString(ref, "ref");
    const trimmed = (asOptionalString(text, "text") ?? "").trim();
    if (!trimmed) {
      await prisma.note.deleteMany({ where: { userId, ref: validRef } });
      return null;
    }
    await prisma.note.upsert({
      where: { userId_ref: { userId, ref: validRef } },
      create: { userId, ref: validRef, text: trimmed },
      update: { text: trimmed },
    });
    return null;
  });
}

// ---- Reading position ----

export async function getReadingPosition(): Promise<
  SyncResult<{ book: string; chapter: number; translation: string; updatedAt: number } | null>
> {
  return withUser(async (userId) => {
    const pos = await prisma.readingPosition.findUnique({ where: { userId } });
    if (!pos) return null;
    return {
      book: pos.book,
      chapter: pos.chapter,
      translation: pos.translation,
      updatedAt: pos.updatedAt.getTime(),
    };
  });
}

export async function upsertReadingPosition(
  book: string,
  chapter: number,
  translation: string,
): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    const validBook = asNonEmptyString(book, "book");
    const validChapter = asPositiveInt(chapter, "chapter");
    const validTranslation = asNonEmptyString(translation, "translation");
    await prisma.readingPosition.upsert({
      where: { userId },
      create: { userId, book: validBook, chapter: validChapter, translation: validTranslation },
      update: { book: validBook, chapter: validChapter, translation: validTranslation },
    });
    return null;
  });
}

// ---- Preferences ----

export interface PreferencesData {
  darkMode: boolean;
  fontSize: number;
  accentTheme: AccentTheme;
  lineSpacing: LineSpacing;
  letterSpacing: LetterSpacing;
  showVerseSelector: boolean;
}

export async function getPreferences(): Promise<SyncResult<PreferencesData>> {
  return withUser(async (userId) => {
    const prefs = await prisma.preference.findUnique({ where: { userId } });
    return prefs ?? PREFERENCE_DEFAULTS;
  });
}

export async function updatePreferences(
  patch: Partial<PreferencesData>,
): Promise<SyncResult<PreferencesData>> {
  return withUser(async (userId) => {
    const validated: { [K in keyof PreferencesData]?: PreferencesData[K] | undefined } = {
      darkMode: asOptionalBoolean(patch.darkMode, "darkMode"),
      fontSize: asOptionalInt(patch.fontSize, "fontSize"),
      accentTheme: asOptionalIn(patch.accentTheme, ACCENT_THEMES, "accentTheme"),
      lineSpacing: asOptionalIn(patch.lineSpacing, LINE_SPACINGS, "lineSpacing"),
      letterSpacing: asOptionalIn(patch.letterSpacing, LETTER_SPACINGS, "letterSpacing"),
      showVerseSelector: asOptionalBoolean(patch.showVerseSelector, "showVerseSelector"),
    };
    // Drop undefined keys — Prisma's inputs (under exactOptionalPropertyTypes)
    // reject an explicit `key: undefined`, they need the key omitted entirely.
    const validPatch = Object.fromEntries(
      Object.entries(validated).filter(([, v]) => v !== undefined),
    ) as Partial<PreferencesData>;
    return prisma.preference.upsert({
      where: { userId },
      create: { userId, ...PREFERENCE_DEFAULTS, ...validPatch },
      update: validPatch,
    });
  });
}
