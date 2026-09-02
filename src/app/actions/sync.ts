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

/** Rows per page for the paginated getX sync actions below. */
const SYNC_PAGE_SIZE = 200;

export interface SyncPage<T> {
  items: T[];
  nextCursor: string | null;
}

export async function getBookmarks(
  cursor?: string,
): Promise<SyncResult<SyncPage<{ ref: string; createdAt: number }>>> {
  return withUser(async (userId) => {
    const validCursor = asOptionalString(cursor, "cursor");
    const rows = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: SYNC_PAGE_SIZE + 1,
      ...(validCursor ? { cursor: { id: validCursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > SYNC_PAGE_SIZE;
    const page = hasMore ? rows.slice(0, SYNC_PAGE_SIZE) : rows;
    return {
      items: page.map((b) => ({ ref: b.ref, createdAt: b.createdAt.getTime() })),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  });
}

export async function upsertBookmark(ref: string, createdAt?: number): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    const validRef = asNonEmptyString(ref, "ref");
    const validCreatedAt = asOptionalInt(createdAt, "createdAt");
    await prisma.bookmark.upsert({
      where: { userId_ref: { userId, ref: validRef } },
      create: {
        userId,
        ref: validRef,
        ...(validCreatedAt ? { createdAt: new Date(validCreatedAt) } : {}),
      },
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

export async function getHighlights(
  cursor?: string,
): Promise<SyncResult<SyncPage<{ ref: string; color: HighlightColor; createdAt: number }>>> {
  return withUser(async (userId) => {
    const validCursor = asOptionalString(cursor, "cursor");
    const rows = await prisma.highlight.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: SYNC_PAGE_SIZE + 1,
      ...(validCursor ? { cursor: { id: validCursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > SYNC_PAGE_SIZE;
    const page = hasMore ? rows.slice(0, SYNC_PAGE_SIZE) : rows;
    return {
      items: page.map((h) => ({ ref: h.ref, color: h.color, createdAt: h.createdAt.getTime() })),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  });
}

/** Upserts a highlight, or deletes it if `color` is null/undefined. */
export async function upsertOrDeleteHighlight(
  ref: string,
  color: HighlightColor | null | undefined,
  createdAt?: number,
): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    const validRef = asNonEmptyString(ref, "ref");
    if (color === null || color === undefined) {
      await prisma.highlight.deleteMany({ where: { userId, ref: validRef } });
      return null;
    }
    const validColor = asIn(color, HIGHLIGHT_COLORS, "color");
    const validCreatedAt = asOptionalInt(createdAt, "createdAt");
    await prisma.highlight.upsert({
      where: { userId_ref: { userId, ref: validRef } },
      create: {
        userId,
        ref: validRef,
        color: validColor,
        ...(validCreatedAt ? { createdAt: new Date(validCreatedAt) } : {}),
      },
      update: { color: validColor },
    });
    return null;
  });
}

// ---- Notes ----

export async function getNotes(
  cursor?: string,
): Promise<
  SyncResult<SyncPage<{ ref: string; text: string; createdAt: number; updatedAt: number }>>
> {
  return withUser(async (userId) => {
    const validCursor = asOptionalString(cursor, "cursor");
    const rows = await prisma.note.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: SYNC_PAGE_SIZE + 1,
      ...(validCursor ? { cursor: { id: validCursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > SYNC_PAGE_SIZE;
    const page = hasMore ? rows.slice(0, SYNC_PAGE_SIZE) : rows;
    return {
      items: page.map((n) => ({
        ref: n.ref,
        text: n.text,
        createdAt: n.createdAt.getTime(),
        updatedAt: n.updatedAt.getTime(),
      })),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  });
}

/** Upserts a note, or deletes it if the trimmed text is empty. */
export async function upsertOrDeleteNote(
  ref: string,
  text: string | undefined,
  createdAt?: number,
): Promise<SyncResult<null>> {
  return withUser(async (userId) => {
    const validRef = asNonEmptyString(ref, "ref");
    const trimmed = (asOptionalString(text, "text") ?? "").trim();
    if (!trimmed) {
      await prisma.note.deleteMany({ where: { userId, ref: validRef } });
      return null;
    }
    const validCreatedAt = asOptionalInt(createdAt, "createdAt");
    await prisma.note.upsert({
      where: { userId_ref: { userId, ref: validRef } },
      create: {
        userId,
        ref: validRef,
        text: trimmed,
        ...(validCreatedAt ? { createdAt: new Date(validCreatedAt) } : {}),
      },
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
