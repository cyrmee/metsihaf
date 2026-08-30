"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { BOOKS, bookName, type BibleBook } from "@/data/books";
import { LANGUAGE_FONT_CLASS, TRANSLATION_BY_ID, type TranslationId } from "@/lib/bible";
import { useChapter } from "@/lib/use-chapter";
import { getShowVerseSelector } from "@/lib/local-store";

interface BookChapterModalProps {
  book: BibleBook;
  chapter: number;
  translation: TranslationId;
  linkTo: "read" | "compare";
  open: boolean;
  onClose: () => void;
  /** Called instead of navigating when the picked chapter/verse is the one already on screen. */
  onJumpToVerse?: (verse: number) => void;
}

/**
 * A centered popup with three side-by-side columns — books, chapters,
 * verses — each independently scrollable. Picking a book updates the
 * chapter column next to it; picking a chapter (when the verse column is
 * on) updates the verse column next to that.
 */
export function BookChapterModal({
  book,
  chapter,
  translation,
  linkTo,
  open,
  onClose,
  onJumpToVerse,
}: BookChapterModalProps) {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState(book);
  const [selectedChapter, setSelectedChapter] = useState(chapter);
  const [query, setQuery] = useState("");
  const [verseSelectorEnabled, setVerseSelectorEnabled] = useState(false);
  const currentBookRef = useRef<HTMLButtonElement>(null);
  const currentChapterRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setQuery("");
      setVerseSelectorEnabled(getShowVerseSelector());
      requestAnimationFrame(() => {
        currentBookRef.current?.scrollIntoView({ block: "center" });
        currentChapterRef.current?.scrollIntoView({ block: "center" });
      });
    }
    // Only reset when the modal opens, not on every prop change while it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const language = TRANSLATION_BY_ID[translation].language;
  const languageFontClass = LANGUAGE_FONT_CLASS[language] ?? "";
  const { data, isLoading } = useChapter(translation, selectedBook.id, selectedChapter);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BOOKS;
    return BOOKS.filter(
      (b) => b.nameEn.toLowerCase().includes(q) || b.nameAm.includes(query.trim()),
    );
  }, [query]);

  if (!open) return null;

  const isSameLocation = (b: string, c: number) => b === book.id && c === chapter;

  const goToChapterStart = (b: BibleBook, n: number) => {
    onClose();
    if (isSameLocation(b.id, n) && onJumpToVerse) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(`/${linkTo}/${b.id}/${n}`);
  };

  const goToVerse = (n: number) => {
    onClose();
    if (isSameLocation(selectedBook.id, selectedChapter) && onJumpToVerse) onJumpToVerse(n);
    else router.push(`/${linkTo}/${selectedBook.id}/${selectedChapter}#v${n}`);
  };

  const selectBook = (b: BibleBook) => {
    setSelectedBook(b);
    setSelectedChapter(1);
  };

  const pickChapter = (n: number) => {
    setSelectedChapter(n);
    if (!verseSelectorEnabled) goToChapterStart(selectedBook, n);
  };

  const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
  const verses = data ? Array.from({ length: data.verses.length }, (_, i) => i + 1) : [];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-1/2 left-1/2 z-50 flex h-[min(38rem,85vh)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col bg-background shadow-[0_16px_48px_-16px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-xl font-semibold text-foreground">Go to</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-carbon flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
          {/* Books */}
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-card">
            <div className="sticky top-0 z-10 bg-card px-3 pt-3 pb-2">
              <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Books
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find…"
                  aria-label="Find a book"
                  className="focus-carbon w-full border border-input bg-background py-2 pr-2 pl-8 text-sm text-foreground"
                />
              </div>
            </div>
            <div className="px-3 pb-3">
              {(["OT", "NT"] as const).map((testament) => {
                const books = filteredBooks.filter((b) => b.testament === testament);
                if (books.length === 0) return null;
                return (
                  <div key={testament} className="mb-3">
                    <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {testament === "OT" ? "Old Testament" : "New Testament"}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {books.map((b) => {
                        const active = b.id === selectedBook.id;
                        return (
                          <button
                            key={b.id}
                            ref={b.id === book.id ? currentBookRef : undefined}
                            type="button"
                            onClick={() => selectBook(b)}
                            aria-current={active ? "true" : undefined}
                            className={`focus-carbon block w-full truncate px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground"
                                : "text-card-foreground hover:bg-accent"
                            } ${languageFontClass}`}
                          >
                            {bookName(b, language)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredBooks.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No book matches &ldquo;{query}&rdquo;.
                </p>
              )}
            </div>
          </div>

          {/* Chapters */}
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-card">
            <div className="sticky top-0 z-10 bg-card px-3 pt-3 pb-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Chapters
              </p>
              <p className={`truncate text-sm font-medium text-foreground ${languageFontClass}`}>
                {bookName(selectedBook, language)}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1 px-3 pb-3 sm:grid-cols-4">
              {chapters.map((n) => {
                const active = n === selectedChapter;
                return (
                  <button
                    key={n}
                    ref={
                      selectedBook.id === book.id && n === chapter ? currentChapterRef : undefined
                    }
                    type="button"
                    onClick={() => pickChapter(n)}
                    aria-current={active ? "true" : undefined}
                    className={`focus-carbon flex h-9 items-center justify-center text-sm font-medium ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verses */}
          {verseSelectorEnabled && (
            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-card">
              <div className="sticky top-0 z-10 bg-card px-3 pt-3 pb-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Verses
                </p>
                <p className={`truncate text-sm font-medium text-foreground ${languageFontClass}`}>
                  {bookName(selectedBook, language)} {selectedChapter}
                </p>
              </div>
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => goToChapterStart(selectedBook, selectedChapter)}
                  className="focus-carbon mb-2 flex w-full items-center justify-center bg-background px-2 py-2 text-xs font-medium text-foreground hover:bg-accent"
                >
                  Start of chapter
                </button>
                {isLoading && (
                  <p className="py-8 text-center text-xs text-muted-foreground">Loading…</p>
                )}
                {!isLoading && (
                  <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
                    {verses.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => goToVerse(n)}
                        className="focus-carbon flex h-9 items-center justify-center bg-background text-sm font-medium text-foreground hover:bg-accent"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
