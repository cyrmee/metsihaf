"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StudyNote } from "@/lib/bible";
import { ReferencePanel } from "@/components/reference-panel";

const SOURCE_LABELS: Record<string, string> = {
  "matthew-henry": "Matthew Henry Bible Commentary",
  "jamieson-fausset-brown": "Jamieson-Fausset-Brown Bible Commentary",
};

// Matthew Henry's commentary is structured as an outline (Roman-numeral,
// lettered, numbered, parenthesized, and bracketed points), but the source
// only sometimes marks a point's start with a newline — other times (e.g. a
// short enumerated list) several points run together in one block of text.
// This also splits before an inline marker like "1. " or "(2.) ", so every
// point gets its own paragraph regardless of which way the source wrote it.
const MARKER = "(?:[IVXLCDM]{1,4}\\.|[a-z]\\.|\\d{1,2}\\.|\\(\\d{1,2}\\.\\)|\\[\\d{1,2}\\.\\])";
const INLINE_MARKER_SPLIT = new RegExp(`(?<=[,;.!?]\\s)(?=${MARKER}\\s+[A-Z"'‘“])`);
const STARTS_WITH_MARKER = new RegExp(`^${MARKER}\\s`);

function splitIntoParagraphs(text: string): string[] {
  const raw = text
    .split("\n")
    .flatMap((block) => block.split(INLINE_MARKER_SPLIT))
    .map((p) => p.trim())
    .filter(Boolean);
  // A `\n` in the source sometimes just breaks a line of quoted poetry
  // rather than starting a new point — if what follows isn't itself a new
  // outline marker, it's a sentence continuation, so fold it back in.
  const paragraphs: string[] = [];
  for (const p of raw) {
    if (paragraphs.length > 0 && /^[a-z]/.test(p) && !STARTS_WITH_MARKER.test(p)) {
      paragraphs[paragraphs.length - 1] += " " + p;
    } else {
      paragraphs.push(p);
    }
  }
  return paragraphs;
}

interface StudyNoteModalProps {
  /** The passage these notes cover, e.g. "John 3:1-21". */
  sourceLabel: string;
  /** One entry per commentary that has a note here — a verse can appear in more than one. */
  notes: StudyNote[];
  open: boolean;
  onClose: () => void;
  /** Reader font size in px, matched to the bible text's current setting. */
  fontSize?: number;
  /** Reader font family, matched to the bible text's current setting. */
  fontFamily?: string;
  /** Reader line height, matched to the bible text's current setting. */
  lineHeight?: number;
  /** Reader letter spacing, matched to the bible text's current setting. */
  letterSpacing?: string;
}

/** Popup showing public-domain commentary notes anchored to a passage — same shell as FootnotesModal/CrossRefsModal. When more than one commentary has a note here, `<`/`>` cycle between them. */
export function StudyNoteModal({
  sourceLabel,
  notes,
  open,
  onClose,
  fontSize,
  fontFamily,
  lineHeight,
  letterSpacing,
}: StudyNoteModalProps) {
  const [active, setActive] = useState(0);
  // Land back on the first commentary whenever the panel is pointed at a
  // new passage, rather than keeping whatever one was last selected.
  useEffect(() => {
    setActive(0);
  }, [sourceLabel]);
  const activeNote = notes[Math.min(active, notes.length - 1)];
  const cycle = (delta: number) => setActive((i) => (i + delta + notes.length) % notes.length);

  return (
    <ReferencePanel title="Study Note" sourceLabel={sourceLabel} open={open} onClose={onClose}>
      {notes.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
          No study note for this verse.
        </p>
      ) : (
        <>
          {notes.length > 1 && (
            <div className="flex items-center justify-between gap-2 border-b border-ink px-2 py-2">
              <button
                type="button"
                onClick={() => cycle(-1)}
                aria-label="Previous commentary"
                className="focus-editorial flex h-7 w-7 shrink-0 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex min-w-0 flex-col items-center">
                <span className="max-w-full truncate font-mono text-[10px] tracking-[0.08em] text-signal uppercase">
                  {SOURCE_LABELS[activeNote?.source ?? ""] ?? activeNote?.source}
                </span>
                <span className="font-mono text-[9px] tracking-[0.06em] text-muted">
                  {active + 1} / {notes.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => cycle(1)}
                aria-label="Next commentary"
                className="focus-editorial flex h-7 w-7 shrink-0 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {activeNote && (
            <div className="px-4 py-3">
              {notes.length === 1 && (
                <p className="mb-3 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
                  {SOURCE_LABELS[activeNote.source] ?? activeNote.source}
                </p>
              )}
              {splitIntoParagraphs(activeNote.text).map((paragraph, i) => (
                <p
                  key={i}
                  className="mb-3 leading-relaxed text-foreground"
                  style={{
                    fontSize: fontSize ? `${fontSize}px` : undefined,
                    fontFamily,
                    lineHeight,
                    letterSpacing,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </ReferencePanel>
  );
}
