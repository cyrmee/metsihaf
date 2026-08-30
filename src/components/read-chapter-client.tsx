"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CaseSensitive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Pilcrow,
  Rows3,
} from "lucide-react";
import { ChapterText, type ChapterTextHandle } from "@/components/chapter-text";
import { BookChapterModal } from "@/components/book-chapter-modal";
import { TranslationSwitcher } from "@/components/translation-switcher";
import { BOOK_BY_ID, bookName, neighborChapter } from "@/data/books";
import { LANGUAGE_FONT_CLASS, TRANSLATION_BY_ID, type TranslationId } from "@/lib/bible";
import { useChapter } from "@/lib/use-chapter";
import {
  getFontSize,
  getLetterSpacing,
  getLineSpacing,
  getPreferredTranslation,
  getVerseView,
  saveReadingPosition,
  setFontSize,
  setLetterSpacing,
  setLineSpacing,
  setPreferredTranslation,
  setVerseView,
  type LetterSpacing,
  type LineSpacing,
  type VerseViewMode,
} from "@/lib/local-store";

const FONT_SIZES = [15, 17, 19, 22, 25];
const LINE_SPACINGS: { id: LineSpacing; label: string }[] = [
  { id: "tight", label: "Tight" },
  { id: "normal", label: "Normal" },
  { id: "relaxed", label: "Relaxed" },
];
const LETTER_SPACINGS: { id: LetterSpacing; label: string }[] = [
  { id: "tight", label: "Tight" },
  { id: "normal", label: "Normal" },
  { id: "wide", label: "Wide" },
];

export function ReadChapterClient({
  book: bookId,
  chapter: chapterParam,
}: {
  book: string;
  chapter: string;
}) {
  const chapter = Number(chapterParam);
  const book = BOOK_BY_ID[bookId];

  const [translation, setTranslation] = useState<TranslationId>("AMH");
  const [fontSize, setFontSizeState] = useState(18);
  const [viewMode, setViewModeState] = useState<VerseViewMode>("line");
  const [lineSpacing, setLineSpacingState] = useState<LineSpacing>("normal");
  const [letterSpacing, setLetterSpacingState] = useState<LetterSpacing>("normal");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const chapterTextRef = useRef<ChapterTextHandle>(null);

  useEffect(() => {
    setTranslation(getPreferredTranslation() as TranslationId);
    setFontSizeState(getFontSize());
    setViewModeState(getVerseView());
    setLineSpacingState(getLineSpacing());
    setLetterSpacingState(getLetterSpacing());
  }, []);

  useEffect(() => {
    if (!fontMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setFontMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [fontMenuOpen]);

  useEffect(() => {
    if (book && Number.isInteger(chapter)) {
      saveReadingPosition({ book: bookId, chapter, translation });
    }
  }, [bookId, chapter, translation, book]);

  const { data, isLoading, error } = useChapter(translation, bookId, chapter);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-foreground">Chapter not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That book or chapter doesn&apos;t exist in the Bible.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to books
        </Link>
      </div>
    );
  }

  const prev = neighborChapter(bookId, chapter, -1);
  const next = neighborChapter(bookId, chapter, 1);

  const changeTranslation = (id: TranslationId) => {
    setTranslation(id);
    setPreferredTranslation(id);
  };

  const changeFontSize = (size: number) => {
    setFontSizeState(size);
    setFontSize(size);
  };

  const changeViewMode = (mode: VerseViewMode) => {
    setViewModeState(mode);
    setVerseView(mode);
  };

  const changeLineSpacing = (spacing: LineSpacing) => {
    setLineSpacingState(spacing);
    setLineSpacing(spacing);
  };

  const changeLetterSpacing = (spacing: LetterSpacing) => {
    setLetterSpacingState(spacing);
    setLetterSpacing(spacing);
  };

  const jumpToVerse = (verse: number) => {
    chapterTextRef.current?.flashVerse(verse);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Change book or chapter"
          title="Change book or chapter"
          className="focus-carbon group flex items-center gap-1.5"
        >
          <h1
            className={`font-display text-3xl font-semibold tracking-tight text-foreground ${LANGUAGE_FONT_CLASS[TRANSLATION_BY_ID[translation].language] ?? ""}`}
          >
            {bookName(book, TRANSLATION_BY_ID[translation].language)} {chapter}
          </h1>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <TranslationSwitcher value={translation} onChange={changeTranslation} size="sm" />
          <Link
            href={`/compare/${bookId}/${chapter}`}
            aria-label="Compare translations"
            className="focus-carbon flex h-8 items-center gap-1.5 border border-border px-2.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Columns2 className="h-3.5 w-3.5" /> Compare
          </Link>
          <div className="relative" ref={fontMenuRef}>
            <button
              type="button"
              aria-label="Text size"
              aria-expanded={fontMenuOpen}
              onClick={() => setFontMenuOpen((v) => !v)}
              className={`focus-carbon flex h-8 w-8 items-center justify-center border ${
                fontMenuOpen
                  ? "border-primary bg-accent text-primary"
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              <CaseSensitive className="h-4 w-4" />
            </button>
            {fontMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 border border-border bg-card p-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)]">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Text size
                </p>
                <div className="mb-3 flex items-center gap-1">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => changeFontSize(size)}
                      aria-label={`Text size ${size}`}
                      aria-pressed={fontSize === size}
                      className={`focus-carbon flex h-8 flex-1 items-center justify-center border font-serif ${
                        fontSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                      style={{ fontSize: `${Math.min(size, 19)}px` }}
                    >
                      A
                    </button>
                  ))}
                </div>

                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Line spacing
                </p>
                <div
                  className="mb-3 flex items-center gap-1"
                  role="group"
                  aria-label="Line spacing"
                >
                  {LINE_SPACINGS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => changeLineSpacing(s.id)}
                      aria-pressed={lineSpacing === s.id}
                      className={`focus-carbon flex h-8 flex-1 items-center justify-center border text-xs font-medium ${
                        lineSpacing === s.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Letter spacing
                </p>
                <div
                  className="mb-3 flex items-center gap-1"
                  role="group"
                  aria-label="Letter spacing"
                >
                  {LETTER_SPACINGS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => changeLetterSpacing(s.id)}
                      aria-pressed={letterSpacing === s.id}
                      className={`focus-carbon flex h-8 flex-1 items-center justify-center border text-xs font-medium ${
                        letterSpacing === s.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Layout
                </p>
                <div className="flex items-center gap-1" role="group" aria-label="Verse layout">
                  <button
                    type="button"
                    onClick={() => changeViewMode("line")}
                    aria-label="Verse per line"
                    aria-pressed={viewMode === "line"}
                    title="Verse per line"
                    className={`focus-carbon flex h-8 flex-1 items-center justify-center border ${
                      viewMode === "line"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-accent"
                    }`}
                  >
                    <Rows3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeViewMode("paragraph")}
                    aria-label="Paragraph"
                    aria-pressed={viewMode === "paragraph"}
                    title="Paragraph"
                    className={`focus-carbon flex h-8 flex-1 items-center justify-center border ${
                      viewMode === "paragraph"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-accent"
                    }`}
                  >
                    <Pilcrow className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BookChapterModal
        book={book}
        chapter={chapter}
        translation={translation}
        linkTo="read"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onJumpToVerse={jumpToVerse}
      />

      {isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <div className="border border-destructive/40 bg-card p-4 text-center text-sm text-destructive">
          Couldn&apos;t load this chapter. {(error as Error).message}
        </div>
      )}
      {data && (
        <ChapterText
          ref={chapterTextRef}
          data={data}
          fontSize={fontSize}
          viewMode={viewMode}
          lineSpacing={lineSpacing}
          letterSpacing={letterSpacing}
        />
      )}

      <nav className="mt-10 flex items-center justify-center gap-3">
        {prev && (
          <Link
            href={`/read/${prev.book}/${prev.chapter}`}
            aria-label={`Previous chapter: ${BOOK_BY_ID[prev.book] ? bookName(BOOK_BY_ID[prev.book]!, TRANSLATION_BY_ID[translation].language) : ""} ${prev.chapter}`}
            title={`${BOOK_BY_ID[prev.book] ? bookName(BOOK_BY_ID[prev.book]!, TRANSLATION_BY_ID[translation].language) : ""} ${prev.chapter}`}
            className="focus-carbon flex h-10 w-10 items-center justify-center border border-border text-foreground hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        {next && (
          <Link
            href={`/read/${next.book}/${next.chapter}`}
            aria-label={`Next chapter: ${BOOK_BY_ID[next.book] ? bookName(BOOK_BY_ID[next.book]!, TRANSLATION_BY_ID[translation].language) : ""} ${next.chapter}`}
            title={`${BOOK_BY_ID[next.book] ? bookName(BOOK_BY_ID[next.book]!, TRANSLATION_BY_ID[translation].language) : ""} ${next.chapter}`}
            className="focus-carbon flex h-10 w-10 items-center justify-center border border-border text-foreground hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
}
