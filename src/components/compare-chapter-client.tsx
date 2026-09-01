"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { ChapterText, type ChapterTextHandle } from "@/components/chapter-text";
import { BookChapterModal } from "@/components/book-chapter-modal";
import { TranslationSwitcher } from "@/components/translation-switcher";
import { BOOK_BY_ID, bookName, neighborChapter } from "@/data/books";
import { LANGUAGE_LABELS, LANGUAGE_FONT_CLASS, type TranslationId } from "@/lib/bible";
import { useChapter } from "@/lib/use-chapter";
import { useChapterNavigation } from "@/lib/use-chapter-nav";
import { useTranslations } from "@/lib/use-translations";
import { getFontSize } from "@/lib/local-store";
import { useIsMobile } from "@/hooks/use-mobile";

export function CompareChapterClient({
  book: bookId,
  chapter: chapterParam,
}: {
  book: string;
  chapter: string;
}) {
  const chapter = Number(chapterParam);
  const book = BOOK_BY_ID[bookId];

  const [left, setLeft] = useState<TranslationId>("HSAB");
  const [right, setRight] = useState<TranslationId>("HSAB");
  const [fontSize, setFontSizeState] = useState(17);
  const [pickerOpen, setPickerOpen] = useState(false);
  const leftTextRef = useRef<ChapterTextHandle>(null);
  const rightTextRef = useRef<ChapterTextHandle>(null);
  const isMobile = useIsMobile();
  const { translations, byId } = useTranslations();
  const autoPickedRight = useRef(false);

  useEffect(() => {
    setFontSizeState(Math.max(15, getFontSize() - 1));
  }, []);

  // Default the right column to a different version than the left one, once
  // the available versions have loaded — only ever done once, so it never
  // overrides a choice the user made themselves.
  useEffect(() => {
    if (autoPickedRight.current || translations.length <= 1) return;
    const other = translations.find((t) => t.id !== left);
    if (other) {
      setRight(other.id);
      autoPickedRight.current = true;
    }
  }, [translations, left]);

  // Two narrower columns need a smaller size to keep from wrapping every word.
  const effectiveFontSize = isMobile ? Math.max(13, fontSize - 3) : fontSize;

  const leftQuery = useChapter(left, bookId, chapter);
  const rightQuery = useChapter(right, bookId, chapter);
  const leftLanguage = byId[left]?.language ?? "en";

  const isValid = !!book && Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters;
  const prev = isValid ? neighborChapter(bookId, chapter, -1) : null;
  const next = isValid ? neighborChapter(bookId, chapter, 1) : null;

  useChapterNavigation({
    prevHref: prev ? `/compare/${prev.book}/${prev.chapter}` : null,
    nextHref: next ? `/compare/${next.book}/${next.chapter}` : null,
    disabled: !isValid || pickerOpen,
  });

  if (!isValid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-foreground">Chapter not found</h1>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to books
        </Link>
      </div>
    );
  }

  const jumpToVerse = (verse: number) => {
    leftTextRef.current?.flashVerse(verse);
    rightTextRef.current?.flashVerse(verse);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Change book or chapter"
          title="Change book or chapter"
          className="focus-carbon group flex items-center gap-1.5"
        >
          <h1
            className={`font-display text-3xl font-semibold tracking-tight text-foreground ${LANGUAGE_FONT_CLASS[leftLanguage] ?? ""}`}
          >
            {bookName(book, leftLanguage)} {chapter}
          </h1>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/read/${bookId}/${chapter}`}
            className="focus-carbon flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
          >
            <BookOpen className="h-3.5 w-3.5" /> Single view
          </Link>
        </div>
      </div>

      <BookChapterModal
        book={book}
        chapter={chapter}
        translation={left}
        linkTo="compare"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onJumpToVerse={jumpToVerse}
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <ComparePane
          ref={leftTextRef}
          translation={left}
          language={byId[left]?.language}
          onChange={setLeft}
          query={leftQuery}
          fontSize={effectiveFontSize}
        />
        <ComparePane
          ref={rightTextRef}
          translation={right}
          language={byId[right]?.language}
          onChange={setRight}
          query={rightQuery}
          fontSize={effectiveFontSize}
        />
      </div>

      <nav className="mt-10 flex items-center justify-center gap-3">
        {prev && (
          <Link
            href={`/compare/${prev.book}/${prev.chapter}`}
            aria-label={`Previous chapter: ${BOOK_BY_ID[prev.book] ? bookName(BOOK_BY_ID[prev.book]!, leftLanguage) : ""} ${prev.chapter}`}
            title={`${BOOK_BY_ID[prev.book] ? bookName(BOOK_BY_ID[prev.book]!, leftLanguage) : ""} ${prev.chapter}`}
            className="focus-carbon flex h-10 w-10 items-center justify-center border border-border text-foreground hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        {next && (
          <Link
            href={`/compare/${next.book}/${next.chapter}`}
            aria-label={`Next chapter: ${BOOK_BY_ID[next.book] ? bookName(BOOK_BY_ID[next.book]!, leftLanguage) : ""} ${next.chapter}`}
            title={`${BOOK_BY_ID[next.book] ? bookName(BOOK_BY_ID[next.book]!, leftLanguage) : ""} ${next.chapter}`}
            className="focus-carbon flex h-10 w-10 items-center justify-center border border-border text-foreground hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
}

interface ComparePaneProps {
  translation: TranslationId;
  language: string | undefined;
  onChange: (id: TranslationId) => void;
  query: ReturnType<typeof useChapter>;
  fontSize: number;
}

const ComparePane = forwardRef<ChapterTextHandle, ComparePaneProps>(function ComparePane(
  { translation, language, onChange, query, fontSize },
  ref,
) {
  return (
    <div className="bg-card">
      <div className="sticky top-12 z-10 flex flex-wrap items-center justify-center gap-2 bg-card px-3 py-2">
        <TranslationSwitcher value={translation} onChange={onChange} size="sm" />
        <span className="text-xs text-muted-foreground">
          {LANGUAGE_LABELS[language ?? ""] ?? language}
        </span>
      </div>
      <div className="px-2 py-3">
        {query.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        )}
        {query.error && (
          <p className="p-3 text-center text-sm text-destructive">
            Couldn&apos;t load this translation. {(query.error as Error).message}
          </p>
        )}
        {query.data && <ChapterText ref={ref} data={query.data} fontSize={fontSize} />}
      </div>
    </div>
  );
});
