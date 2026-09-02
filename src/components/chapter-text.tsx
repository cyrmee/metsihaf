"use client";

import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Asterisk,
  BookOpen,
  Bookmark,
  Check,
  Copy,
  Link2,
  NotebookPen,
  Share2,
} from "lucide-react";
import type { ChapterData, Translation } from "@/lib/bible";
import { BOOK_BY_ID, bookName, type BibleBook } from "@/data/books";
import { CrossRefsModal } from "@/components/cross-refs-modal";
import { FootnotesModal } from "@/components/footnotes-modal";
import { StudyNoteModal } from "@/components/study-note-modal";
import {
  AMHARIC_FONT_STACKS,
  ENGLISH_FONT_STACKS,
  getAmharicFont,
  getEnglishFont,
  getHighlight,
  getNote,
  highlightRef,
  isBookmarked,
  LETTER_SPACING_VALUES,
  LINE_SPACING_VALUES,
  onStoreChange,
  setHighlight,
  setNote,
  toggleBookmark,
  type AmharicFont,
  type EnglishFont,
  type HighlightColor,
  type LetterSpacing,
  type LineSpacing,
} from "@/lib/local-store";
import { useStoreVersion } from "@/lib/use-store-version";
import { useTranslations } from "@/lib/use-translations";

// A highlighter wash behind the text — text stays the normal ink color.
const HIGHLIGHT_CLASSES: Record<HighlightColor, string> = {
  yellow: "bg-highlight-yellow/25 text-foreground",
  red: "bg-highlight-red/20 text-foreground",
  orange: "bg-highlight-orange/20 text-foreground",
  brown: "bg-highlight-brown/20 text-foreground",
  green: "bg-highlight-green/20 text-foreground",
  teal: "bg-highlight-teal/20 text-foreground",
  blue: "bg-highlight-blue/20 text-foreground",
  purple: "bg-highlight-purple/20 text-foreground",
  pink: "bg-highlight-pink/20 text-foreground",
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

// BSB folds a Psalm's musical/authorial superscription (e.g. "For the
// choirmaster. According to Sheminith. A Psalm of David.") into verse 1's
// `text` rather than a separate field. We detect and style it apart at
// render time instead of splitting the data, so footnote/red-letter
// character offsets (anchored into the original `text`) stay valid.
const SUPERSCRIPTION_KEYWORDS = [
  "choirmaster",
  "maskil",
  "miktam",
  "michtam",
  "shiggaion",
  "ascents",
  "gittith",
  "sheminith",
  "mahalath",
  "shoshannim",
  "shushan",
  "jeduthun",
  "alamoth",
  "leannoth",
  "a contemplation",
  "an instruction",
];
const SUPERSCRIPTION_STARTSWITH = [
  "a psalm",
  "a song",
  "a prayer",
  "of david",
  "of asaph",
  "of solomon",
  "of moses",
  "of heman",
  "of ethan",
  "of korah",
  "of the sons of korah",
];
const SUPERSCRIPTION_CONTINUATION = [
  "when ",
  "according to",
  "for the",
  "to the tune",
  "upon ",
  "on the",
];
// Psalms whose leading "When …" clause is poetic body text, not a title —
// caps how many leading sentence fragments count as the superscription (0
// excludes the psalm entirely).
const SUPERSCRIPTION_MAX_FRAGS: Record<number, number> = { 114: 0, 126: 1 };

function fragmentIsSuperscriptionTitle(fragment: string): boolean {
  const low = fragment.toLowerCase().trim();
  return (
    SUPERSCRIPTION_KEYWORDS.some((k) => low.includes(k)) ||
    SUPERSCRIPTION_STARTSWITH.some((k) => low.startsWith(k)) ||
    SUPERSCRIPTION_CONTINUATION.some((k) => low.startsWith(k))
  );
}

/** Character length of the leading superscription in a Psalm's verse 1 text, 0 if none. */
function psalmSuperscriptionLength(
  book: string,
  chapter: number,
  verse: number,
  text: string,
): number {
  if (book !== "PSA" || verse !== 1) return 0;
  const parts = text.split(/(?<=\.)\s+/);
  const cap = SUPERSCRIPTION_MAX_FRAGS[chapter];
  let end = 0;
  let i = 0;
  while (
    i < parts.length &&
    (cap === undefined || i < cap) &&
    fragmentIsSuperscriptionTitle(parts[i]!)
  ) {
    if (i > 0) end += 1; // the separator space consumed by the split
    end += parts[i]!.length;
    i++;
  }
  return end;
}

/**
 * Renders a verse's text with red-letter spans styled, footnote anchors
 * marked with a lettered superscript (a, b, c…), and a leading Psalm
 * superscription (if any) styled apart — all in source order. Each is
 * optional per-translation markup carried on the verse itself.
 */
function renderVerseText(
  text: string,
  redLetter?: [number, number][],
  footnotes?: { at: number }[],
): ReactNode {
  if (!redLetter?.length && !footnotes?.length) return text;
  const { after } = renderVerseTextParts(text, redLetter, footnotes, 0);
  return after;
}

/**
 * Like {@link renderVerseText}, but splits the output at `superscriptionEnd`
 * (from {@link psalmSuperscriptionLength}) into `before` (the Psalm
 * superscription, styled as its own line) and `after` (the verse body) —
 * `before` is empty when there's no superscription.
 */
function renderVerseTextParts(
  text: string,
  redLetter: [number, number][] | undefined,
  footnotes: { at: number }[] | undefined,
  superscriptionEnd: number,
): { before: ReactNode[]; after: ReactNode[] } {
  type Event =
    | { pos: number; kind: "redStart" }
    | { pos: number; kind: "redEnd" }
    | { pos: number; kind: "supEnd" }
    | { pos: number; kind: "note"; letter: string };
  const events: Event[] = [];
  for (const [start, end] of redLetter ?? []) {
    events.push({ pos: start, kind: "redStart" }, { pos: end, kind: "redEnd" });
  }
  (footnotes ?? []).forEach((f, i) => {
    events.push({ pos: f.at, kind: "note", letter: String.fromCharCode(97 + i) });
  });
  if (superscriptionEnd) events.push({ pos: superscriptionEnd, kind: "supEnd" });
  // At the same offset, close spans before placing a note marker or opening the next span.
  const order = { redEnd: 0, supEnd: 0, note: 1, redStart: 2 };
  events.sort((a, b) => a.pos - b.pos || order[a.kind] - order[b.kind]);

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let redDepth = 0;
  let key = 0;
  let splitAt = 0;
  const flush = (end: number) => {
    if (end <= cursor) return;
    const segment = text.slice(cursor, end);
    nodes.push(
      redDepth > 0 ? (
        <span key={key++} className="text-vermilion">
          {segment}
        </span>
      ) : (
        <span key={key++}>{segment}</span>
      ),
    );
    cursor = end;
  };
  for (const e of events) {
    flush(e.pos);
    if (e.kind === "redStart") redDepth++;
    else if (e.kind === "redEnd") redDepth--;
    else if (e.kind === "supEnd") splitAt = nodes.length;
    else
      nodes.push(
        <sup key={key++} className="ml-0.5 select-none text-[0.65em] font-semibold text-ochre">
          {e.letter}
        </sup>,
      );
  }
  flush(text.length);
  return { before: nodes.slice(0, splitAt), after: nodes.slice(splitAt) };
}

/** A run of consecutive verses under the same section heading (or no heading, for the chapter's opening verses before its first one), all rendered the same way — either flowing as one paragraph or broken one verse per line. */
interface VerseGroup {
  heading?: string;
  subheading?: string;
  /** Rendered one verse per line (a quoted poem/song) instead of folded into a flowing paragraph. */
  poetic: boolean;
  verses: ChapterData["verses"];
}

/**
 * Splits a chapter's verses into groups at each heading and at every
 * poetic/prose transition — a heading is block-level, so it can't sit inside
 * the single flowing `<p>` a prose run renders as, and a poetic run needs
 * its own one-verse-per-line treatment instead of joining the paragraph
 * around it.
 */
function groupForDisplay(
  verses: ChapterData["verses"],
  isPoetic: (v: ChapterData["verses"][number]) => boolean,
): VerseGroup[] {
  const groups: VerseGroup[] = [];
  for (const v of verses) {
    const poetic = isPoetic(v);
    const last = groups[groups.length - 1];
    if (v.heading || !last || last.poetic !== poetic) {
      groups.push({
        ...(v.heading ? { heading: v.heading } : {}),
        ...(v.subheading ? { subheading: v.subheading } : {}),
        poetic,
        verses: [],
      });
    }
    groups[groups.length - 1]!.verses.push(v);
  }
  return groups;
}

/** A section heading, e.g. "Giving to the Needy" — only present for translations whose source marks them (currently BSB). */
function SectionHeading({
  heading,
  subheading,
  isFirst,
}: {
  heading: string;
  subheading?: string;
  isFirst?: boolean;
}) {
  return (
    <div className={`mb-2 px-2 ${isFirst ? "mt-0" : "mt-8"}`}>
      <h2 className="font-display text-2xl font-medium text-foreground italic">{heading}</h2>
      {subheading && (
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{subheading}</p>
      )}
    </div>
  );
}

interface ChapterTextProps {
  data: ChapterData;
  fontSize: number;
  /** Enable selection / study actions. */
  interactive?: boolean;
  lineSpacing?: LineSpacing;
  letterSpacing?: LetterSpacing;
  /**
   * Fires with a reference like "Genesis 1:1-3" while a selection is active,
   * and null once it's cleared — so the reading card's index row can show
   * what's selected instead of the toolbar carrying its own label.
   */
  onSelectionChange?: (label: string | null) => void;
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
    lineSpacing = "normal",
    letterSpacing = "normal",
    onSelectionChange,
  },
  ref,
) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // A single slot for whichever of cross-refs/footnotes/study-note is open
  // from an inline verse mark, so opening one always closes another instead
  // of letting them stack.
  const [openPanel, setOpenPanel] = useState<{
    kind: "refs" | "notes" | "study";
    verse: number;
  } | null>(null);
  const openRefsVerse = openPanel?.kind === "refs" ? openPanel.verse : null;
  const openNotesVerse = openPanel?.kind === "notes" ? openPanel.verse : null;
  const openStudyNoteVerse = openPanel?.kind === "study" ? openPanel.verse : null;
  const [englishFont, setEnglishFontState] = useState<EnglishFont>("sourceSerif");
  const [amharicFont, setAmharicFontState] = useState<AmharicFont>("notoSerif");
  const storeVersion = useStoreVersion();
  void storeVersion; // re-render on store changes
  const containerRef = useRef<HTMLDivElement>(null);

  // Read the saved font choice only after mount (matching the SSR-safe default
  // above) so a returning visitor's non-default pick doesn't cause a hydration
  // mismatch, and stay in sync if it's changed on the Settings page.
  useEffect(() => {
    const apply = () => {
      setEnglishFontState(getEnglishFont());
      setAmharicFontState(getAmharicFont());
    };
    apply();
    return onStoreChange(apply);
  }, []);

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

  const { byId } = useTranslations();
  const translation: Translation = byId[data.translation] ?? {
    id: data.translation,
    language: "en",
  };
  const isAmharic = translation.language === "am";
  const book = BOOK_BY_ID[data.book];
  const fontFamily = isAmharic
    ? AMHARIC_FONT_STACKS[amharicFont]
    : ENGLISH_FONT_STACKS[englishFont];

  const toggleVerse = (verse: number) => {
    if (!interactive) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(verse)) next.delete(verse);
      else next.add(verse);
      return next;
    });
  };

  const verseHighlight = (verse: number) =>
    interactive
      ? getHighlight(highlightRef(data.translation, `${data.book}.${data.chapter}.${verse}`))
      : undefined;

  /** Classes for the inline span that carries the highlight wash — kept thin and identical in both view modes. */
  const verseClass = (verse: number, isSelected: boolean) => {
    const highlight = verseHighlight(verse);
    return [
      "box-decoration-clone px-0.5 py-px",
      highlight ? HIGHLIGHT_CLASSES[highlight.color] : "text-foreground",
      isSelected
        ? "underline decoration-dotted decoration-2 decoration-primary underline-offset-4"
        : "",
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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenPanel((p) =>
              p?.kind === "refs" && p.verse === verse ? null : { kind: "refs", verse },
            );
          }}
          aria-label="Open cross-references"
          title="Cross-references"
          className="focus-editorial ml-1.5 inline-flex h-4 w-4 items-center justify-center align-baseline text-muted-foreground hover:text-primary"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
      )}
      {interactive && (data.verses.find((v) => v.verse === verse)?.footnotes?.length ?? 0) > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenPanel((p) =>
              p?.kind === "notes" && p.verse === verse ? null : { kind: "notes", verse },
            );
          }}
          aria-label="Open footnotes"
          title="Footnotes"
          className="focus-editorial ml-1.5 inline-flex h-4 w-4 items-center justify-center align-baseline text-muted-foreground hover:text-primary"
        >
          <Asterisk className="h-3.5 w-3.5" />
        </button>
      )}
      {interactive && data.verses.find((v) => v.verse === verse)?.studyNote && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenPanel((p) =>
              p?.kind === "study" && p.verse === verse ? null : { kind: "study", verse },
            );
          }}
          aria-label="Open study note"
          title="Study note"
          className="focus-editorial ml-1.5 inline-flex h-4 w-4 items-center justify-center align-baseline text-muted-foreground hover:text-primary"
        >
          <BookOpen className="h-3.5 w-3.5" />
        </button>
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
          fontFamily,
        }}
      >
        {groupForDisplay(data.verses, (v) => v.poetic ?? false).map((group, gi) => (
          <div key={gi}>
            {group.heading && (
              <SectionHeading
                heading={group.heading}
                {...(group.subheading ? { subheading: group.subheading } : {})}
                isFirst={gi === 0}
              />
            )}
            {group.poetic ? (
              group.verses.map((v) => {
                const ref = `${data.book}.${data.chapter}.${v.verse}`;
                const isSelected = selected.has(v.verse);
                const supLen = psalmSuperscriptionLength(data.book, data.chapter, v.verse, v.text);
                const { before, after } = supLen
                  ? renderVerseTextParts(v.text, v.redLetter, v.footnotes, supLen)
                  : {
                      before: [],
                      after: renderVerseText(v.text, v.redLetter, v.footnotes),
                    };
                return (
                  <Fragment key={v.verse}>
                    {before.length > 0 && (
                      <p className="px-2 italic text-muted-foreground">{before}</p>
                    )}
                    <p
                      id={`v${v.verse}`}
                      onClick={() => toggleVerse(v.verse)}
                      className={`px-2 ${interactive ? "cursor-pointer" : ""}`}
                    >
                      {extraAnchors(v)}
                      <sup className="mr-1.5 select-none text-[0.65em] font-semibold text-ochre">
                        {v.label ?? v.verse}
                      </sup>
                      <span className={verseClass(v.verse, isSelected)}>{after}</span>
                      {marks(v.verse, ref)}
                    </p>
                  </Fragment>
                );
              })
            ) : (
              <p className="px-2 py-1">
                {group.verses.map((v) => {
                  const ref = `${data.book}.${data.chapter}.${v.verse}`;
                  const isSelected = selected.has(v.verse);
                  return (
                    <span
                      key={v.verse}
                      id={`v${v.verse}`}
                      onClick={() => toggleVerse(v.verse)}
                      className={`mr-2 ${interactive ? "cursor-pointer" : ""}`}
                    >
                      {extraAnchors(v)}
                      <sup className="mr-1 select-none text-[0.65em] font-semibold text-ochre">
                        {v.label ?? v.verse}
                      </sup>
                      <span className={verseClass(v.verse, isSelected)}>
                        {renderVerseText(v.text, v.redLetter, v.footnotes)}
                      </span>{" "}
                      {marks(v.verse, ref)}
                    </span>
                  );
                })}
              </p>
            )}
          </div>
        ))}
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
          onSelectionLabelChange={onSelectionChange}
          fontSize={fontSize}
        />
      )}

      {interactive && book && openRefsVerse !== null && (
        <CrossRefsModal
          sourceLabel={`${bookName(book, translation.language)} ${data.chapter}:${
            data.verses.find((v) => v.verse === openRefsVerse)?.label ?? openRefsVerse
          }`}
          translation={data.translation}
          refs={data.verses.find((v) => v.verse === openRefsVerse)?.refs ?? []}
          open={openRefsVerse !== null}
          onClose={() => setOpenPanel(null)}
          fontSize={fontSize}
          fontFamily={fontFamily}
          lineHeight={LINE_SPACING_VALUES[lineSpacing]}
          letterSpacing={LETTER_SPACING_VALUES[letterSpacing]}
        />
      )}

      {interactive && book && openNotesVerse !== null && (
        <FootnotesModal
          sourceLabel={`${bookName(book, translation.language)} ${data.chapter}:${
            data.verses.find((v) => v.verse === openNotesVerse)?.label ?? openNotesVerse
          }`}
          footnotes={data.verses.find((v) => v.verse === openNotesVerse)?.footnotes ?? []}
          open={openNotesVerse !== null}
          onClose={() => setOpenPanel(null)}
          fontSize={fontSize}
          fontFamily={fontFamily}
          lineHeight={LINE_SPACING_VALUES[lineSpacing]}
          letterSpacing={LETTER_SPACING_VALUES[letterSpacing]}
        />
      )}

      {interactive && book && openStudyNoteVerse !== null && (
        <StudyNoteModal
          sourceLabel={(() => {
            const note = data.verses.find((v) => v.verse === openStudyNoteVerse)?.studyNote;
            const range =
              note && note.verseEnd > openStudyNoteVerse
                ? `${openStudyNoteVerse}-${note.verseEnd}`
                : `${openStudyNoteVerse}`;
            return `${bookName(book, translation.language)} ${data.chapter}:${range}`;
          })()}
          note={data.verses.find((v) => v.verse === openStudyNoteVerse)?.studyNote ?? null}
          open={openStudyNoteVerse !== null}
          onClose={() => setOpenPanel(null)}
          fontSize={fontSize}
          fontFamily={fontFamily}
          lineHeight={LINE_SPACING_VALUES[lineSpacing]}
          letterSpacing={LETTER_SPACING_VALUES[letterSpacing]}
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
  translation: Translation;
  verses: ChapterData["verses"];
  selected: Set<number>;
  onClear: () => void;
  onSelectionLabelChange?: ((label: string | null) => void) | undefined;
  fontSize: number;
}

/**
 * Action bar for the current verse selection. Below `xl` it floats above
 * the viewport's bottom edge; at `xl`+ it docks beside the reading card as
 * a narrow vertical rail (see the outer positioning classes below) — either
 * way it works the same whether one verse or several are selected.
 */
function SelectionToolbar({
  bookId,
  book,
  chapter,
  translation,
  verses,
  selected,
  onClear,
  onSelectionLabelChange,
  fontSize,
}: SelectionToolbarProps) {
  const storeVersion = useStoreVersion();
  void storeVersion;
  const [panel, setPanel] = useState<"note" | null>(null);
  // A single slot for whichever of cross-refs/footnotes/study-note is open,
  // so opening one always closes another instead of letting them stack.
  const [refPanel, setRefPanel] = useState<"refs" | "notes" | "study" | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const selectedList = verses
    .filter((v) => selected.has(v.verse))
    .sort((a, b) => a.verse - b.verse);
  const refs = (n: number) => `${bookId}.${chapter}.${n}`;
  const hlRefs = (n: number) => highlightRef(translation.id, refs(n));
  const single = selectedList.length === 1 ? selectedList[0] : null;

  useEffect(() => {
    setNoteDraft(null);
    if (selectedList.length === 0) {
      setPanel(null);
      setRefPanel(null);
    }
    if (selectedList.length !== 1) {
      setRefPanel(null);
    }
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

  useEffect(() => {
    onSelectionLabelChange?.(label);
    return () => onSelectionLabelChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSelectionLabelChange is a setter, stable enough not to need re-running the effect on identity change
  }, [label]);

  const allBookmarked = selectedList.every((v) => isBookmarked(refs(v.verse)));

  const copyVerses = async () => {
    const text = [
      `${label} (${translation.id})`,
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
    const allMatch = selectedList.every((v) => getHighlight(hlRefs(v.verse))?.color === color);
    selectedList.forEach((v) => setHighlight(hlRefs(v.verse), allMatch ? null : color));
    onClear();
  };

  const clearHighlights = () => {
    selectedList.forEach((v) => setHighlight(hlRefs(v.verse), null));
    onClear();
  };

  const anyHighlighted = selectedList.some((v) => getHighlight(hlRefs(v.verse)));

  return (
    <>
      <div
        className={
          "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 " +
          "bottom-[calc(var(--nav-bar-height)+0.75rem+env(safe-area-inset-bottom))] md:bottom-6 md:px-4 " +
          // At xl+ this is `position: fixed` at a constant point in the
          // *viewport* — not docked to the card via scroll-tracking sticky
          // positioning — so it never drifts during scroll, same as the
          // cross-ref/footnote/study-note panels (see reference-panel.tsx).
          // `right` is measured from the reading card's own left edge
          // (card is centered via `mx-auto max-w-3xl px-4`, so its border
          // sits at `50% - 24rem + 1rem`) rather than a translate off the
          // card itself, so this works the same regardless of the rail's
          // own width (icons-only vs. the wider note editor). The 2.25rem
          // gap and the `top` value both match the cross-ref/footnote/
          // study-note panels on the card's other side (reference-panel.tsx)
          // — level with the reading card itself, below the book/chapter
          // selector row, not the masthead alone.
          "xl:fixed xl:inset-x-auto xl:right-[calc(50%+25.25rem)] xl:top-[11.5rem] xl:bottom-auto xl:left-auto xl:block xl:px-0"
        }
      >
        <div
          className={`relative w-full max-w-3xl border border-ink bg-field-inset pointer-events-auto shadow-[10px_10px_0_rgba(23,32,29,0.11)] xl:max-h-[calc(100vh-13rem)] xl:overflow-y-auto xl:[mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)] xl:[scrollbar-width:none] xl:[&::-webkit-scrollbar]:hidden ${
            panel === "note" ? "xl:w-64 xl:max-w-none" : "xl:w-16 xl:max-w-none"
          }`}
        >
          {/* A thin bridge line reading the rail as attached to the card beside it, not a floating panel. */}
          <span
            aria-hidden="true"
            className="hidden xl:absolute xl:top-0 xl:-right-9 xl:block xl:h-px xl:w-9 xl:bg-ink"
          />
          {panel === "note" && selectedList.length > 0 && (
            <div className="py-2.5 pr-3 pl-4">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
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
                className="focus-editorial w-full border border-[#b8b4aa] bg-paper-white p-2 text-sm text-ink"
                placeholder="Write your note…"
              />
              <div className="mt-1.5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const text = noteDraft ?? sharedNoteText;
                    selectedList.forEach((v) => setNote(refs(v.verse), text));
                    setPanel(null);
                  }}
                  className="focus-editorial bg-signal px-3 py-1 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase hover:bg-signal-hover"
                >
                  Save note
                </button>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  className="focus-editorial text-xs text-ink underline decoration-1 underline-offset-4 hover:text-signal"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 py-2.5 pr-3 pl-4 xl:flex-col xl:gap-1.5 xl:px-2 xl:py-4">
            <div className="flex flex-wrap items-center gap-1 xl:flex xl:flex-col xl:gap-1.5">
              <button
                type="button"
                onClick={copyVerses}
                aria-label="Copy verse text"
                title="Copy"
                className="focus-editorial flex h-8 w-8 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-signal" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={shareVerses}
                aria-label="Share verse link"
                title="Share"
                className="focus-editorial flex h-8 w-8 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white"
              >
                {linkCopied ? (
                  <Check className="h-3.5 w-3.5 text-signal" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleBookmarks}
                aria-label={allBookmarked ? "Remove bookmark" : "Bookmark"}
                title="Bookmark"
                className={`focus-editorial flex h-8 w-8 items-center justify-center border ${
                  allBookmarked
                    ? "border-signal bg-signal text-paper-white"
                    : "border-ink text-ink hover:bg-ink hover:text-paper-white"
                }`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${allBookmarked ? "fill-paper-white" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setPanel(panel === "note" ? null : "note")}
                aria-label="Add or edit note"
                title="Note"
                className={`focus-editorial flex h-8 w-8 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-40 ${
                  panel === "note"
                    ? "border-signal bg-signal text-paper-white"
                    : "border-ink text-ink hover:bg-ink hover:text-paper-white"
                }`}
              >
                <NotebookPen className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                disabled={!single || single.refs.length === 0}
                onClick={() => setRefPanel(refPanel === "refs" ? null : "refs")}
                aria-label="Cross-references"
                title="Cross-references"
                className={`focus-editorial flex h-8 w-8 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink ${
                  refPanel === "refs"
                    ? "border-signal bg-signal text-paper-white"
                    : "border-ink text-ink hover:bg-ink hover:text-paper-white"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                disabled={!single || (single.footnotes?.length ?? 0) === 0}
                onClick={() => setRefPanel(refPanel === "notes" ? null : "notes")}
                aria-label="Footnotes"
                title="Footnotes"
                className={`focus-editorial flex h-8 w-8 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink ${
                  refPanel === "notes"
                    ? "border-signal bg-signal text-paper-white"
                    : "border-ink text-ink hover:bg-ink hover:text-paper-white"
                }`}
              >
                <Asterisk className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                disabled={!single?.studyNote}
                onClick={() => setRefPanel(refPanel === "study" ? null : "study")}
                aria-label="Study note"
                title="Study note"
                className={`focus-editorial flex h-8 w-8 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink ${
                  refPanel === "study"
                    ? "border-signal bg-signal text-paper-white"
                    : "border-ink text-ink hover:bg-ink hover:text-paper-white"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-ink py-2 pr-3 pl-4 xl:flex-col xl:items-center xl:gap-2 xl:px-2 xl:py-3">
            <div
              className="flex flex-1 items-center gap-2 overflow-x-auto scroll-px-4 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] [scrollbar-width:none] xl:flex xl:flex-col xl:[mask-image:none] xl:overflow-visible [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Highlight color"
            >
              {HIGHLIGHT_SWATCHES.map((s) => {
                const active = selectedList.every(
                  (v) => getHighlight(hlRefs(v.verse))?.color === s.color,
                );
                return (
                  <button
                    key={s.color}
                    type="button"
                    title={s.label}
                    aria-label={`Highlight ${s.label}`}
                    onClick={() => applyHighlight(s.color)}
                    className={`focus-editorial h-9 w-9 shrink-0 border-2 ${s.className} ${
                      active
                        ? "border-ink outline outline-2 outline-offset-2 outline-signal"
                        : "border-rule"
                    }`}
                  />
                );
              })}
              <span aria-hidden="true" className="w-2 shrink-0 xl:hidden" />
            </div>
            {anyHighlighted && (
              <button
                type="button"
                onClick={clearHighlights}
                className="focus-editorial shrink-0 px-1.5 py-1 text-xs text-ink underline decoration-1 underline-offset-4 hover:text-signal xl:w-full xl:text-center"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {single && (
        <CrossRefsModal
          sourceLabel={`${bookName(book, translation.language)} ${chapter}:${single.label ?? single.verse}`}
          translation={translation.id}
          refs={single.refs}
          open={refPanel === "refs"}
          onClose={() => setRefPanel(null)}
          fontSize={fontSize}
        />
      )}

      {single && (
        <FootnotesModal
          sourceLabel={`${bookName(book, translation.language)} ${chapter}:${single.label ?? single.verse}`}
          footnotes={single.footnotes ?? []}
          open={refPanel === "notes"}
          onClose={() => setRefPanel(null)}
          fontSize={fontSize}
        />
      )}

      {single && (
        <StudyNoteModal
          sourceLabel={`${bookName(book, translation.language)} ${chapter}:${
            single.studyNote && single.studyNote.verseEnd > single.verse
              ? `${single.verse}-${single.studyNote.verseEnd}`
              : (single.label ?? single.verse)
          }`}
          note={single.studyNote ?? null}
          open={refPanel === "study"}
          onClose={() => setRefPanel(null)}
          fontSize={fontSize}
        />
      )}
    </>
  );
}
