"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { BOOKS, bookName, type BibleBook } from "@/data/books";
import { LANGUAGE_FONT_CLASS, type TranslationId } from "@/lib/bible";
import { useTranslations } from "@/lib/use-translations";

interface BookChapterModalProps {
  book: BibleBook;
  chapter: number;
  translation: TranslationId;
  open: boolean;
  onClose: () => void;
  /** Called instead of navigating when the picked chapter/verse is the one already on screen. */
  onJumpToVerse?: (verse: number) => void;
}

/**
 * A centered popup with two side-by-side columns — books and chapters —
 * each independently scrollable. Picking a book updates the chapter
 * column next to it; picking a chapter navigates there directly.
 */
export function BookChapterModal({
  book,
  chapter,
  translation,
  open,
  onClose,
  onJumpToVerse,
}: BookChapterModalProps) {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState(book);
  const [selectedChapter, setSelectedChapter] = useState(chapter);
  /** Below `md`, the two columns are shown one at a time instead of side by side. */
  const [mobileStep, setMobileStep] = useState<"books" | "chapters">("books");
  const currentBookRef = useRef<HTMLButtonElement>(null);
  const currentChapterRef = useRef<HTMLButtonElement>(null);
  const booksColRef = useRef<HTMLDivElement>(null);
  const chaptersColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setMobileStep("books");
      // Land on the book/chapter list ready to scroll, not with the search
      // box focused (which pops the keyboard on mobile before the user has
      // asked to search) — tapping the search field is how you opt into it.
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

  const { byId } = useTranslations();
  const language = byId[translation]?.language ?? "en";
  const languageFontClass = LANGUAGE_FONT_CLASS[language] ?? "";

  if (!open) return null;

  const isSameLocation = (b: string, c: number) => b === book.id && c === chapter;

  const goToChapterStart = (b: BibleBook, n: number) => {
    onClose();
    if (isSameLocation(b.id, n) && onJumpToVerse) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(`/read/${b.id}/${n}`);
  };

  const selectBook = (b: BibleBook) => {
    setSelectedBook(b);
    setSelectedChapter(1);
    setMobileStep("chapters");
  };

  const pickChapter = (n: number) => {
    setSelectedChapter(n);
    goToChapterStart(selectedBook, n);
  };

  const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);

  /** Focuses the button whose row is nearest above/below the current one, matching horizontal position — works for both single-column lists and multi-column grids. */
  const focusRow = (container: HTMLElement, current: HTMLButtonElement, dir: 1 | -1) => {
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
    const rect = current.getBoundingClientRect();
    const candidates = buttons.filter((b) => {
      const r = b.getBoundingClientRect();
      return dir > 0 ? r.top > rect.top + 1 : r.top < rect.top - 1;
    });
    if (candidates.length === 0) return;
    const targetTop =
      dir > 0
        ? Math.min(...candidates.map((b) => b.getBoundingClientRect().top))
        : Math.max(...candidates.map((b) => b.getBoundingClientRect().top));
    const row = candidates.filter((b) => Math.abs(b.getBoundingClientRect().top - targetTop) < 2);
    const centerX = rect.left + rect.width / 2;
    row.sort(
      (a, b) =>
        Math.abs(a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2 - centerX) -
        Math.abs(b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2 - centerX),
    );
    row[0]?.focus();
  };

  /** Focuses the column's active item (aria-current) if there is one, else its first button. */
  const focusColumnEntry = (ref: RefObject<HTMLDivElement | null>) => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector<HTMLButtonElement>('button[aria-current="true"]');
    (active ?? el.querySelector<HTMLButtonElement>("button"))?.focus();
  };

  const onColumnKeyDown = (
    e: ReactKeyboardEvent<HTMLDivElement>,
    ref: RefObject<HTMLDivElement | null>,
    onLeftEdge?: () => void,
    onRightEdge?: () => void,
  ) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "BUTTON") return;
    const container = ref.current;
    if (!container) return;
    const button = target as HTMLButtonElement;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      focusRow(container, button, e.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
      const idx = buttons.indexOf(button);
      if (e.key === "ArrowLeft") {
        if (idx > 0) buttons[idx - 1]?.focus();
        else onLeftEdge?.();
      } else {
        if (idx < buttons.length - 1) buttons[idx + 1]?.focus();
        else onRightEdge?.();
      }
    }
  };

  return (
    <>
      <div
        className="animate-in fade-in-0 fixed inset-0 z-50 bg-black/50 duration-150"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="animate-in zoom-in-95 fixed top-1/2 left-1/2 z-50 flex h-[min(38rem,85vh)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col border border-ink bg-paper shadow-[10px_10px_0_rgba(23,32,29,0.11)] duration-150">
        <div className="flex items-center justify-between border-b border-ink px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileStep("books")}
            className={`focus-editorial flex items-center gap-1 py-1 pr-2 pl-1 text-sm text-ink hover:text-signal md:hidden ${
              mobileStep === "chapters" ? "" : "invisible"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            {bookName(selectedBook, language)}
          </button>
          <span className="hidden font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase md:block">
            Choose a passage
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-editorial flex h-8 w-8 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
          {/* Books */}
          <div
            ref={booksColRef}
            className={`min-w-0 flex-1 flex-col overflow-y-auto md:flex md:flex-[4] ${
              mobileStep === "books" ? "flex" : "hidden"
            }`}
            onKeyDown={(e) =>
              onColumnKeyDown(e, booksColRef, undefined, () => focusColumnEntry(chaptersColRef))
            }
          >
            <div className="px-3 pt-3 pb-3">
              {(["OT", "NT"] as const).map((testament, i) => {
                const books = BOOKS.filter((b) => b.testament === testament);
                if (books.length === 0) return null;
                return (
                  <div key={testament} className={i === 0 ? "mb-5" : ""}>
                    <div className="mb-2 flex items-center gap-2 px-2.5">
                      <span className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                        {testament === "OT" ? "Old Testament" : "New Testament"}
                      </span>
                      <span aria-hidden="true" className="h-px flex-1 bg-rule" />
                    </div>
                    <div className="flex flex-col">
                      {books.map((b) => {
                        const active = b.id === selectedBook.id;
                        return (
                          <button
                            key={b.id}
                            ref={b.id === book.id ? currentBookRef : undefined}
                            type="button"
                            onClick={() => selectBook(b)}
                            aria-current={active ? "true" : undefined}
                            className={`focus-editorial flex w-full items-center gap-1.5 truncate border-l-2 px-2.5 py-2 text-left text-sm transition-colors ${
                              active
                                ? "border-signal bg-field-neutral font-semibold text-signal"
                                : "border-transparent text-ink hover:bg-field-neutral"
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
            </div>
          </div>

          {/* Chapters */}
          <div
            ref={chaptersColRef}
            className={`min-w-0 flex-1 flex-col overflow-y-auto md:flex md:flex-[5] md:border-l md:border-ink ${
              mobileStep === "chapters" ? "flex" : "hidden"
            }`}
            onKeyDown={(e) =>
              onColumnKeyDown(e, chaptersColRef, () => focusColumnEntry(booksColRef), undefined)
            }
          >
            <div className="mb-2 flex items-center gap-2 px-3 pt-3">
              <span className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                Chapters
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-rule" />
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 pb-3 sm:grid-cols-5 md:grid-cols-6">
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
                    className={`focus-editorial flex h-10 items-center justify-center border font-mono text-sm ${
                      active
                        ? "border-signal bg-signal font-bold text-paper-white"
                        : "border-rule text-ink hover:border-ink hover:bg-field-neutral"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
