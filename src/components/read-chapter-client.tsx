"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CaseSensitive, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ChapterText, type ChapterTextHandle } from "@/components/chapter-text";
import { BookChapterModal } from "@/components/book-chapter-modal";
import { InlineSelect } from "@/components/inline-select";
import { TranslationSwitcher } from "@/components/translation-switcher";
import { BOOK_BY_ID, bookName, neighborChapter } from "@/data/books";
import { LANGUAGE_FONT_CLASS, type TranslationId } from "@/lib/bible";
import { useChapter, useStudyNotes } from "@/lib/use-chapter";
import { useChapterNavigation } from "@/lib/use-chapter-nav";
import { useTranslations } from "@/lib/use-translations";
import {
  AMHARIC_FONT_STACKS,
  ENGLISH_FONT_STACKS,
  getAmharicFont,
  getEnglishFont,
  getFontSize,
  getLetterSpacing,
  getLineSpacing,
  getPreferredTranslation,
  saveReadingPosition,
  setAmharicFont,
  setEnglishFont,
  setFontSize,
  setLetterSpacing,
  setLineSpacing,
  setPreferredTranslation,
  type AmharicFont,
  type EnglishFont,
  type LetterSpacing,
  type LineSpacing,
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
const ENGLISH_FONTS: { id: EnglishFont; label: string }[] = [
  { id: "sourceSerif", label: "Source Serif" },
  { id: "literata", label: "Literata" },
  { id: "merriweather", label: "Merriweather" },
  { id: "lora", label: "Lora" },
  { id: "crimsonPro", label: "Crimson Pro" },
  { id: "plexSans", label: "Plex Sans" },
];
const AMHARIC_FONTS: { id: AmharicFont; label: string }[] = [
  { id: "notoSerif", label: "Noto Serif" },
  { id: "notoSans", label: "Noto Sans" },
  { id: "abyssinica", label: "Abyssinica" },
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

  const [translation, setTranslation] = useState<TranslationId>("HSAB");
  const [fontSize, setFontSizeState] = useState(18);
  const [lineSpacing, setLineSpacingState] = useState<LineSpacing>("normal");
  const [letterSpacing, setLetterSpacingState] = useState<LetterSpacing>("normal");
  const [englishFont, setEnglishFontState] = useState<EnglishFont>("sourceSerif");
  const [amharicFont, setAmharicFontState] = useState<AmharicFont>("notoSerif");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const chapterTextRef = useRef<ChapterTextHandle>(null);
  const [selectionLabel, setSelectionLabel] = useState<string | null>(null);
  const { byId } = useTranslations();
  const language = byId[translation]?.language ?? "en";
  const fontOptions =
    language === "am"
      ? AMHARIC_FONTS.map((f) => ({
          id: f.id,
          label: f.label,
          style: { fontFamily: AMHARIC_FONT_STACKS[f.id] },
        }))
      : ENGLISH_FONTS.map((f) => ({
          id: f.id,
          label: f.label,
          style: { fontFamily: ENGLISH_FONT_STACKS[f.id] },
        }));

  useEffect(() => {
    setTranslation(getPreferredTranslation() as TranslationId);
    setFontSizeState(getFontSize());
    setLineSpacingState(getLineSpacing());
    setLetterSpacingState(getLetterSpacing());
    setEnglishFontState(getEnglishFont());
    setAmharicFontState(getAmharicFont());
  }, []);

  useEffect(() => {
    if (!fontMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFontMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fontMenuOpen]);

  useEffect(() => {
    if (book && Number.isInteger(chapter)) {
      saveReadingPosition({ book: bookId, chapter, translation });
    }
  }, [bookId, chapter, translation, book]);

  const { data: chapterData, isLoading, error } = useChapter(translation, bookId, chapter);
  const { data: studyNotesData } = useStudyNotes(bookId, chapter);

  const data = useMemo(() => {
    if (!chapterData) return chapterData;
    if (!studyNotesData?.notes.length) return chapterData;
    const noteByVerse = new Map(studyNotesData.notes.map((n) => [n.verse, n]));
    return {
      ...chapterData,
      verses: chapterData.verses.map((v) => {
        const note = noteByVerse.get(v.verse);
        return note
          ? { ...v, studyNote: { verseEnd: note.verseEnd, text: note.text, source: note.source } }
          : v;
      }),
    };
  }, [chapterData, studyNotesData]);

  const isValid = !!book && Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters;
  const prev = isValid ? neighborChapter(bookId, chapter, -1) : null;
  const next = isValid ? neighborChapter(bookId, chapter, 1) : null;

  useChapterNavigation({
    prevHref: prev ? `/read/${prev.book}/${prev.chapter}` : null,
    nextHref: next ? `/read/${next.book}/${next.chapter}` : null,
    disabled: !isValid || pickerOpen || fontMenuOpen,
  });

  if (!isValid) {
    return (
      <div className="mx-auto max-w-3xl px-2 py-16 text-center sm:px-4">
        <h1 className="font-display text-xl font-semibold text-foreground">Chapter not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That book or chapter doesn&apos;t exist in the Bible.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-signal hover:underline">
          Back to books
        </Link>
      </div>
    );
  }

  const changeTranslation = (id: TranslationId) => {
    setTranslation(id);
    setPreferredTranslation(id);
  };

  const changeFontSize = (size: number) => {
    setFontSizeState(size);
    setFontSize(size);
  };

  const fontSizeIndex = Math.max(0, FONT_SIZES.indexOf(fontSize));
  const stepFontSize = (delta: 1 | -1) => {
    const next = FONT_SIZES[fontSizeIndex + delta];
    if (next !== undefined) changeFontSize(next);
  };

  const changeLineSpacing = (spacing: LineSpacing) => {
    setLineSpacingState(spacing);
    setLineSpacing(spacing);
  };

  const changeLetterSpacing = (spacing: LetterSpacing) => {
    setLetterSpacingState(spacing);
    setLetterSpacing(spacing);
  };

  const changeEnglishFont = (font: EnglishFont) => {
    setEnglishFontState(font);
    setEnglishFont(font);
  };

  const changeAmharicFont = (font: AmharicFont) => {
    setAmharicFontState(font);
    setAmharicFont(font);
  };

  const jumpToVerse = (verse: number) => {
    chapterTextRef.current?.flashVerse(verse);
  };

  return (
    // At xl+ this becomes a fixed-height shell — masthead height already
    // reserved by the body's own padding, see layout.tsx — so that the
    // reading card can make its verse text the *only* scrolling region
    // (below). Everything else (this selector row, the card's header row,
    // the highlight rail, and the reference panels) then simply never
    // moves, instead of relying on sticky/fixed tricks layered over a
    // scrolling page.
    <div className="mx-auto max-w-3xl px-2 py-6 sm:px-4 xl:flex xl:h-[calc(100vh-var(--masthead-height))] xl:flex-col xl:overflow-hidden">
      <div className="mb-10 flex flex-wrap items-center justify-center gap-3 xl:shrink-0">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Change book or chapter"
          title="Change book or chapter"
          className="focus-editorial group flex h-9 items-center gap-2.5 border border-ink px-3 hover:bg-ink hover:text-paper-white"
        >
          <h1 className="sr-only">
            {bookName(book, language)} {chapter}
          </h1>
          <span
            aria-hidden="true"
            className={`font-display text-sm font-medium ${language === "am" ? LANGUAGE_FONT_CLASS[language] : "italic"}`}
          >
            {bookName(book, language)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 transition-colors" />
        </button>
        <TranslationSwitcher value={translation} onChange={changeTranslation} />
        <button
          type="button"
          aria-label="Text size"
          aria-expanded={fontMenuOpen}
          onClick={() => setFontMenuOpen(true)}
          className={`focus-editorial flex h-9 w-9 items-center justify-center border ${
            fontMenuOpen
              ? "border-signal bg-signal text-paper-white"
              : "border-ink text-ink hover:bg-ink hover:text-paper-white"
          }`}
        >
          <CaseSensitive className="h-4 w-4" />
        </button>
      </div>

      {fontMenuOpen && (
        <>
          <div
            className="animate-in fade-in-0 fixed inset-0 z-[60] bg-black/50 duration-150"
            onClick={() => setFontMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Reading settings"
            className="animate-in zoom-in-95 fixed top-1/2 left-1/2 z-[60] max-h-[85vh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink bg-paper shadow-[10px_10px_0_rgba(23,32,29,0.11)] duration-150"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-ink bg-paper px-4 py-3">
              <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
                Reading settings
              </span>
              <button
                type="button"
                onClick={() => setFontMenuOpen(false)}
                aria-label="Close"
                className="focus-editorial flex h-8 w-8 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                Text size
              </p>
              <div className="flex items-center border border-ink">
                <button
                  type="button"
                  onClick={() => stepFontSize(-1)}
                  disabled={fontSizeIndex === 0}
                  aria-label="Decrease text size"
                  className="focus-editorial flex h-9 w-9 shrink-0 items-center justify-center border-r border-ink font-mono text-base text-ink hover:bg-ink hover:text-paper-white disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
                >
                  −
                </button>
                <div
                  className="flex flex-1 items-center justify-center font-serif text-ink"
                  style={{ fontSize: `${Math.min(fontSize, 19)}px` }}
                  aria-hidden="true"
                >
                  A
                </div>
                <button
                  type="button"
                  onClick={() => stepFontSize(1)}
                  disabled={fontSizeIndex === FONT_SIZES.length - 1}
                  aria-label="Increase text size"
                  className="focus-editorial flex h-9 w-9 shrink-0 items-center justify-center border-l border-ink font-mono text-base text-ink hover:bg-ink hover:text-paper-white disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
                >
                  +
                </button>
              </div>
              <p
                className="mb-3 flex items-center justify-between pt-1.5 font-mono text-[10px] tracking-[0.06em] text-muted"
                aria-live="polite"
              >
                <span>
                  SIZE {fontSizeIndex + 1}/{FONT_SIZES.length}
                </span>
                <span>{fontSize}PX</span>
              </p>

              <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                Font
              </p>
              <InlineSelect
                className="mb-3"
                ariaLabel="Font"
                value={language === "am" ? amharicFont : englishFont}
                onChange={(id) =>
                  language === "am"
                    ? changeAmharicFont(id as AmharicFont)
                    : changeEnglishFont(id as EnglishFont)
                }
                triggerStyle={{
                  fontFamily:
                    language === "am"
                      ? AMHARIC_FONT_STACKS[amharicFont]
                      : ENGLISH_FONT_STACKS[englishFont],
                }}
                options={fontOptions}
              />

              <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                Line spacing
              </p>
              <div
                className="mb-3 flex items-center border border-ink"
                role="group"
                aria-label="Line spacing"
              >
                {LINE_SPACINGS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => changeLineSpacing(s.id)}
                    aria-pressed={lineSpacing === s.id}
                    className={`focus-editorial flex h-8 flex-1 items-center justify-center text-xs ${i > 0 ? "border-l border-ink" : ""} ${
                      lineSpacing === s.id
                        ? "bg-ink text-paper-white"
                        : "text-ink hover:bg-field-neutral"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                Letter spacing
              </p>
              <div
                className="flex items-center border border-ink"
                role="group"
                aria-label="Letter spacing"
              >
                {LETTER_SPACINGS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => changeLetterSpacing(s.id)}
                    aria-pressed={letterSpacing === s.id}
                    className={`focus-editorial flex h-8 flex-1 items-center justify-center text-xs ${i > 0 ? "border-l border-ink" : ""} ${
                      letterSpacing === s.id
                        ? "bg-ink text-paper-white"
                        : "text-ink hover:bg-field-neutral"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <BookChapterModal
        book={book}
        chapter={chapter}
        translation={translation}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onJumpToVerse={jumpToVerse}
      />

      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground xl:shrink-0">Loading…</p>
      )}
      {error && (
        <div className="border border-signal bg-field-conflict p-4 text-center text-sm text-signal xl:shrink-0">
          Couldn&apos;t load this chapter. {(error as Error).message}
        </div>
      )}
      {data && (
        <div className="border border-ink bg-paper shadow-[10px_10px_0_rgba(23,32,29,0.11)] xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden">
          {/*
            Sticky below `xl` so the selection state (what's picked for
            highlighting, copying, etc.) stays visible while scrolling
            through a long chapter on a single-column page. `top-0` below
            `xl` because mobile has no fixed masthead reserving space above
            the card (AppNav docks to the *bottom* there) — this row's own
            natural position is well under 11.5rem on a mobile layout, and
            a sticky offset greater than an element's natural document
            position clamps it down to that offset immediately, even at
            scroll 0, overlapping whatever follows it in flow (its reserved
            layout space is still based on the smaller natural position).
            At `xl`+ the card itself no longer scrolls (only the verse text
            below does — see the next div) and this row's own natural flow
            position already lands it level with the highlight rail and
            cross-ref/footnote/study-note panels beside the card, so it
            just sits fixed in place there as an ordinary, non-scrolling
            (`static`) flex child instead — no `top` offset needed.
          */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink bg-paper px-3 py-2.5 sm:px-6 xl:static xl:shrink-0">
            <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
              {selectionLabel
                ? `Selected / ${selectionLabel}`
                : `Reading / ${bookName(book, language)} ${chapter}`}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-rule" />
          </div>
          <div className="relative px-1 py-6 sm:px-6 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-y-auto">
            <ChapterText
              ref={chapterTextRef}
              data={data}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              letterSpacing={letterSpacing}
              onSelectionChange={setSelectionLabel}
            />
            {/*
              Left inside the scrolling text (not pinned as a fixed footer)
              so it reads as the end of the chapter, arrived at by scrolling
              — the same place it's always been — rather than a
              persistently visible control.
            */}
            <nav
              aria-label="Chapter navigation"
              className="mt-6 -mx-1 flex items-stretch sm:mx-0 xl:mt-auto xl:shrink-0 xl:pt-6"
            >
              {prev ? (
                <Link
                  href={`/read/${prev.book}/${prev.chapter}`}
                  aria-label={`Previous chapter: ${BOOK_BY_ID[prev.book] ? bookName(BOOK_BY_ID[prev.book]!, language) : ""} ${prev.chapter}`}
                  className="focus-editorial flex flex-1 items-center justify-center gap-2 border-r border-ink py-4 text-ink hover:bg-field-neutral"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="font-mono text-[11px] tracking-[0.06em] uppercase">
                    Previous
                  </span>
                </Link>
              ) : (
                <span className="flex-1 border-r border-ink" />
              )}
              {next ? (
                <Link
                  href={`/read/${next.book}/${next.chapter}`}
                  aria-label={`Next chapter: ${BOOK_BY_ID[next.book] ? bookName(BOOK_BY_ID[next.book]!, language) : ""} ${next.chapter}`}
                  className="focus-editorial flex flex-1 items-center justify-center gap-2 bg-signal py-4 text-paper-white hover:bg-signal-hover"
                >
                  <span className="font-mono text-[11px] tracking-[0.06em] uppercase">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="flex-1" />
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
