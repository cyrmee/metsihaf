"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Bookmark, Check, Copy, Link2, NotebookPen, Share2, X } from "lucide-react";
import type { ChapterData, TranslationId } from "@/lib/bible";
import { TRANSLATION_BY_ID } from "@/lib/bible";
import { BOOK_BY_ID, bookName, type BibleBook } from "@/data/books";
import { CrossRefsModal } from "@/components/cross-refs-modal";
import {
  getHighlight,
  getNote,
  isBookmarked,
  LETTER_SPACING_VALUES,
  LINE_SPACING_VALUES,
  setHighlight,
  setNote,
  toggleBookmark,
  type HighlightColor,
  type LetterSpacing,
  type LineSpacing,
  type VerseViewMode,
} from "@/lib/local-store";
import { useStoreVersion } from "@/lib/use-store-version";

// Light theme: an actual highlighter wash behind the text (text stays the
// normal ink color). Dark theme keeps the old colored-text treatment — a
// solid marker wash reads poorly against a dark page.
const HIGHLIGHT_CLASSES: Record<HighlightColor, string> = {
  yellow: "bg-highlight-yellow/25 text-foreground dark:bg-transparent dark:text-highlight-yellow",
  red: "bg-highlight-red/20 text-foreground dark:bg-transparent dark:text-highlight-red",
  orange: "bg-highlight-orange/20 text-foreground dark:bg-transparent dark:text-highlight-orange",
  brown: "bg-highlight-brown/20 text-foreground dark:bg-transparent dark:text-highlight-brown",
  green: "bg-highlight-green/20 text-foreground dark:bg-transparent dark:text-highlight-green",
  teal: "bg-highlight-teal/20 text-foreground dark:bg-transparent dark:text-highlight-teal",
  blue: "bg-highlight-blue/20 text-foreground dark:bg-transparent dark:text-highlight-blue",
  purple: "bg-highlight-purple/20 text-foreground dark:bg-transparent dark:text-highlight-purple",
  pink: "bg-highlight-pink/20 text-foreground dark:bg-transparent dark:text-highlight-pink",
};

/** Just the dark-mode colored-text half of the above, for when the selection background takes over the light-mode wash. */
const HIGHLIGHT_DARK_TEXT_CLASSES: Record<HighlightColor, string> = {
  yellow: "dark:text-highlight-yellow",
  red: "dark:text-highlight-red",
  orange: "dark:text-highlight-orange",
  brown: "dark:text-highlight-brown",
  green: "dark:text-highlight-green",
  teal: "dark:text-highlight-teal",
  blue: "dark:text-highlight-blue",
  purple: "dark:text-highlight-purple",
  pink: "dark:text-highlight-pink",
};

const HIGHLIGHT_SWATCHES: { color: HighlightColor; className: string; label: string }[] = [
  { color: "yellow", className: "bg-highlight-yellow", label: "Yellow" },
  { color: "red", className: "bg-highlight-red", label: "Red" },
  { color: "orange", className: "bg-highlight-orange", label: "Orange" },
  { color: "brown", className: "bg-highlight-brown", label: "Brown" },
  { color: "green", className: "bg-highlight-green", label: "Green" },
  { color: "teal", className: "bg-highlight-teal", label: "Teal" },
  { color: "blue", className: "bg-highlight-blue", label: "Blue" },
  { color: "purple", className: "bg-highlight-purple", label: "Purple" },
  { color: "pink", className: "bg-highlight-pink", label: "Pink" },
];

interface ChapterTextProps {
  data: ChapterData;
  fontSize: number;
  /** Enable selection / study actions (disabled in compact compare cells). */
  interactive?: boolean;
  /** One verse per line, or the chapter set as a single flowing paragraph. */
  viewMode?: VerseViewMode;
  lineSpacing?: LineSpacing;
  letterSpacing?: LetterSpacing;
}

export interface ChapterTextHandle {
  /** Scroll a verse into view and briefly highlight it. */
  flashVerse: (verse: number) => void;
}

/** Renders a chapter's verses with highlight + study action support. */
export const ChapterText = forwardRef<ChapterTextHandle, ChapterTextProps>(function ChapterText(
  {
    data,
    fontSize,
    interactive = true,
    viewMode = "line",
    lineSpacing = "normal",
    letterSpacing = "normal",
  },
  ref,
) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const storeVersion = useStoreVersion();
  void storeVersion; // re-render on store changes
  const containerRef = useRef<HTMLDivElement>(null);

  const flashVerse = useCallback((verse: number) => {
    const el = containerRef.current?.querySelector<HTMLElement>(`#v${verse}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("verse-flash");
    void el.offsetWidth; // force reflow so a repeat flash restarts the animation
    el.classList.add("verse-flash");
    el.addEventListener("animationend", () => el.classList.remove("verse-flash"), { once: true });
  }, []);

  useImperativeHandle(ref, () => ({ flashVerse }), [flashVerse]);

  // A link to a specific verse (e.g. "#v5") flashes it once the chapter has loaded.
  useEffect(() => {
    const m = /^#v(\d+)$/.exec(window.location.hash);
    if (m) flashVerse(Number(m[1]));
  }, [data.book, data.chapter, data.translation, flashVerse]);

  // Selection is tied to a chapter view; drop it if the chapter changes underneath us.
  useEffect(() => {
    setSelected(new Set());
  }, [data.book, data.chapter, data.translation]);

  const translation = TRANSLATION_BY_ID[data.translation];
  const isAmharic = translation.language === "am";
  const book = BOOK_BY_ID[data.book];

  if (data.unavailable) {
    return (
      <div className="border border-border bg-card p-6 text-center">
        <h3 className="text-sm font-semibold text-card-foreground">{translation.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">Coming soon.</p>
      </div>
    );
  }

  const toggleVerse = (verse: number) => {
    if (!interactive) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(verse)) next.delete(verse);
      else next.add(verse);
      return next;
    });
  };

  const verseClass = (verse: number, isSelected: boolean) => {
    const highlight = interactive
      ? getHighlight(`${data.book}.${data.chapter}.${verse}`)
      : undefined;
    // Selection's own background wins while active; the highlight's colored
    // text still shows through so you can tell it's highlighted underneath.
    if (isSelected) {
      return [
        interactive ? "cursor-pointer" : "",
        "bg-accent/70 shadow-[inset_2px_0_0_0_var(--color-primary)]",
        highlight ? HIGHLIGHT_DARK_TEXT_CLASSES[highlight.color] : "text-foreground",
      ]
        .filter(Boolean)
        .join(" ");
    }
    return [
      interactive ? "cursor-pointer" : "",
      highlight ? HIGHLIGHT_CLASSES[highlight.color] : "text-foreground",
    ]
      .filter(Boolean)
      .join(" ");
  };

  /** Anchor targets for every verse number a combined group covers besides its own (e.g. #v14 for a "13-14" group), so links and navigation to any member land here. */
  const extraAnchors = (v: ChapterData["verses"][number]) => {
    if (!v.verseEnd || v.verseEnd <= v.verse) return null;
    const ids = [];
    for (let n = v.verse + 1; n <= v.verseEnd; n++) ids.push(n);
    return ids.map((n) => <span key={n} id={`v${n}`} />);
  };

  const marks = (verse: number, ref: string) => (
    <>
      {interactive && data.verses.find((v) => v.verse === verse)!.refs.length > 0 && (
        <Link2
          className="ml-1.5 inline h-3.5 w-3.5 align-baseline text-muted-foreground"
          aria-label="Has cross-references"
        />
      )}
      {interactive && isBookmarked(ref) && (
        <Bookmark className="ml-1 inline h-3.5 w-3.5 fill-primary align-baseline text-primary" />
      )}
      {interactive && getNote(ref) && (
        <NotebookPen className="ml-1 inline h-3.5 w-3.5 align-baseline text-muted-foreground" />
      )}
    </>
  );

  return (
    <>
      <div
        ref={containerRef}
        className={isAmharic ? "scripture-text-am" : "scripture-text"}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: LINE_SPACING_VALUES[lineSpacing],
          letterSpacing: LETTER_SPACING_VALUES[letterSpacing],
        }}
      >
        {viewMode === "paragraph" ? (
          <p className="px-2 py-1">
            {data.verses.map((v) => {
              const ref = `${data.book}.${data.chapter}.${v.verse}`;
              const isSelected = selected.has(v.verse);
              return (
                <span
                  key={v.verse}
                  id={`v${v.verse}`}
                  onClick={() => toggleVerse(v.verse)}
                  className={`box-decoration-clone mr-2 px-0.5 py-1 ${verseClass(v.verse, isSelected)}`}
                >
                  {extraAnchors(v)}
                  <sup className="mr-1 select-none text-[0.65em] font-semibold text-primary">
                    {v.label ?? v.verse}
                  </sup>
                  {v.text} {marks(v.verse, ref)}
                </span>
              );
            })}
          </p>
        ) : (
          data.verses.map((v) => {
            const ref = `${data.book}.${data.chapter}.${v.verse}`;
            const isSelected = selected.has(v.verse);
            return (
              <p
                key={v.verse}
                id={`v${v.verse}`}
                onClick={() => toggleVerse(v.verse)}
                className={`px-2 py-0.5 ${verseClass(v.verse, isSelected)}`}
              >
                {extraAnchors(v)}
                <sup className="mr-1.5 select-none text-[0.65em] font-semibold text-primary">
                  {v.label ?? v.verse}
                </sup>
                <span>{v.text}</span>
                {marks(v.verse, ref)}
              </p>
            );
          })
        )}
      </div>

      {interactive && book && selected.size > 0 && (
        <SelectionToolbar
          bookId={data.book}
          book={book}
          chapter={data.chapter}
          translation={translation}
          verses={data.verses}
          selected={selected}
          onClear={() => setSelected(new Set())}
        />
      )}
    </>
  );
});

/** Turns a set of verse numbers into "1–3, 5, 8–9". */
function formatVerseRanges(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  const parts: string[] = [];
  let start = sorted[0]!;
  let prev = sorted[0]!;
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  parts.push(start === prev ? `${start}` : `${start}–${prev}`);
  return parts.join(", ");
}

interface SelectionToolbarProps {
  bookId: string;
  book: BibleBook;
  chapter: number;
  translation: (typeof TRANSLATION_BY_ID)[TranslationId];
  verses: ChapterData["verses"];
  selected: Set<number>;
  onClear: () => void;
}

/**
 * Floating action bar for the current verse selection. Fixed to the
 * viewport, so it never reflows the reading column underneath it — and it
 * works the same whether one verse or several are selected.
 */
function SelectionToolbar({
  bookId,
  book,
  chapter,
  translation,
  verses,
  selected,
  onClear,
}: SelectionToolbarProps) {
  const storeVersion = useStoreVersion();
  void storeVersion;
  const [panel, setPanel] = useState<"note" | null>(null);
  const [refsOpen, setRefsOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const selectedList = verses
    .filter((v) => selected.has(v.verse))
    .sort((a, b) => a.verse - b.verse);
  const refs = (n: number) => `${bookId}.${chapter}.${n}`;
  const single = selectedList.length === 1 ? selectedList[0] : null;

  useEffect(() => {
    setNoteDraft(null);
    if (selectedList.length === 0) {
      setPanel(null);
      setRefsOpen(false);
    }
    if (selectedList.length !== 1) setRefsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const firstNoteText = getNote(refs(selectedList[0]?.verse ?? 0))?.text ?? "";
  const sharedNoteText = selectedList.every(
    (v) => (getNote(refs(v.verse))?.text ?? "") === firstNoteText,
  )
    ? firstNoteText
    : "";

  const label = `${bookName(book, translation.language)} ${chapter}:${formatVerseRanges(
    selectedList.map((v) => v.verse),
  )}`;

  const allBookmarked = selectedList.every((v) => isBookmarked(refs(v.verse)));

  const copyVerses = async () => {
    const text = [
      `${label} (${translation.name})`,
      ...selectedList.map((v) => `${v.label ?? v.verse} ${v.text}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied — nothing more we can do here.
    }
  };

  const shareVerses = async () => {
    const first = selectedList[0];
    if (!first) return;
    const url = `${window.location.origin}/read/${bookId}/${chapter}#v${first.verse}`;
    const text = selectedList.map((v) => `${v.label ?? v.verse} ${v.text}`).join("\n");
    if (navigator.share) {
      try {
        await navigator.share({ title: label, text, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      // Clipboard access denied — nothing more we can do here.
    }
  };

  const toggleBookmarks = () => {
    selectedList.forEach((v) => {
      const ref = refs(v.verse);
      if (allBookmarked) {
        if (isBookmarked(ref)) toggleBookmark(ref);
      } else if (!isBookmarked(ref)) {
        toggleBookmark(ref);
      }
    });
  };

  const applyHighlight = (color: HighlightColor) => {
    const allMatch = selectedList.every((v) => getHighlight(refs(v.verse))?.color === color);
    selectedList.forEach((v) => setHighlight(refs(v.verse), allMatch ? null : color));
    onClear();
  };

  const clearHighlights = () => {
    selectedList.forEach((v) => setHighlight(refs(v.verse), null));
    onClear();
  };

  const anyHighlighted = selectedList.some((v) => getHighlight(refs(v.verse)));

  return (
    <>
      <div
        className={
          "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 " +
          "bottom-[calc(var(--nav-pill-clearance)+env(safe-area-inset-bottom))] md:bottom-6 md:px-4"
        }
      >
        <div className="animate-in fade-in slide-in-from-bottom-3 relative w-full max-w-3xl border border-border bg-card pointer-events-auto shadow-[0_16px_48px_-16px_rgba(0,0,0,0.5)] duration-200">
          {/* Rubric tab — echoes the left-bar mark on a selected verse in the text above. */}
          <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />

          {panel === "note" && selectedList.length > 0 && (
            <div className="py-2.5 pr-3 pl-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {single
                  ? `Note on verse ${single.label ?? single.verse}`
                  : `Note on verses ${formatVerseRanges(selectedList.map((v) => v.verse))}`}
              </p>
              {!single && (
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Saved to each selected verse.
                </p>
              )}
              <textarea
                value={noteDraft ?? sharedNoteText}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={2}
                autoFocus
                className="focus-carbon w-full border border-input bg-background p-2 text-sm text-foreground"
                placeholder="Write your note…"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = noteDraft ?? sharedNoteText;
                    selectedList.forEach((v) => setNote(refs(v.verse), text));
                    setPanel(null);
                  }}
                  className="focus-carbon bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Save note
                </button>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  className="focus-carbon border border-border px-3 py-1 text-xs text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 py-2.5 pr-3 pl-4">
            <span className="mr-1 text-sm font-semibold text-card-foreground">{label}</span>

            <div className="ml-auto flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={copyVerses}
                aria-label="Copy verse text"
                title="Copy"
                className="focus-carbon flex h-8 w-8 items-center justify-center border border-border text-foreground hover:bg-accent"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={shareVerses}
                aria-label="Share verse link"
                title="Share"
                className="focus-carbon flex h-8 w-8 items-center justify-center border border-border text-foreground hover:bg-accent"
              >
                {linkCopied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleBookmarks}
                aria-label={allBookmarked ? "Remove bookmark" : "Bookmark"}
                title="Bookmark"
                className={`focus-carbon flex h-8 w-8 items-center justify-center border ${
                  allBookmarked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-accent"
                }`}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 ${allBookmarked ? "fill-primary-foreground" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setPanel(panel === "note" ? null : "note")}
                aria-label="Add or edit note"
                title="Note"
                className={`focus-carbon flex h-8 w-8 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-40 ${
                  panel === "note"
                    ? "border-primary bg-accent text-primary"
                    : "border-border text-foreground hover:bg-accent"
                }`}
              >
                <NotebookPen className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                disabled={!single || single.refs.length === 0}
                onClick={() => setRefsOpen(true)}
                aria-label="Cross-references"
                title="Cross-references"
                className="focus-carbon flex h-8 w-8 items-center justify-center border border-border text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>

              <div
                className="ml-1.5 flex items-center gap-1.5"
                role="group"
                aria-label="Highlight color"
              >
                {HIGHLIGHT_SWATCHES.map((s) => {
                  const active = selectedList.every(
                    (v) => getHighlight(refs(v.verse))?.color === s.color,
                  );
                  return (
                    <button
                      key={s.color}
                      type="button"
                      title={s.label}
                      aria-label={`Highlight ${s.label}`}
                      onClick={() => applyHighlight(s.color)}
                      className={`focus-carbon h-6 w-6 border ${s.className} ${
                        active ? "ring-2 ring-primary" : "border-border"
                      }`}
                    />
                  );
                })}
                {anyHighlighted && (
                  <button
                    type="button"
                    onClick={clearHighlights}
                    className="focus-carbon px-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClear}
                aria-label="Close selection"
                title="Close"
                className="focus-carbon ml-1.5 flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {single && (
        <CrossRefsModal
          sourceLabel={`${bookName(book, translation.language)} ${chapter}:${single.label ?? single.verse}`}
          refs={single.refs}
          open={refsOpen}
          onClose={() => setRefsOpen(false)}
        />
      )}
    </>
  );
}
