"use client";

import type { StudyNote } from "@/lib/bible";
import { ReferencePanel } from "@/components/reference-panel";

const SOURCE_LABELS: Record<string, string> = {
  "matthew-henry": "Matthew Henry Bible Commentary",
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
  /** The passage this note covers, e.g. "John 3:1-21". */
  sourceLabel: string;
  note: StudyNote | null;
  open: boolean;
  onClose: () => void;
  /** Reader font size in px, matched to the bible text's current setting. */
  fontSize?: number;
}

/** Popup showing a public-domain commentary note anchored to a passage — same shell as FootnotesModal/CrossRefsModal. */
export function StudyNoteModal({
  sourceLabel,
  note,
  open,
  onClose,
  fontSize,
}: StudyNoteModalProps) {
  return (
    <ReferencePanel title="Study Note" sourceLabel={sourceLabel} open={open} onClose={onClose}>
      <div className="px-4 py-3">
        {!note ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No study note for this verse.
          </p>
        ) : (
          <>
            {splitIntoParagraphs(note.text).map((paragraph, i) => (
              <p
                key={i}
                className="mb-3 leading-relaxed text-foreground"
                style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
              >
                {paragraph}
              </p>
            ))}
            <p className="mt-4 border-t border-rule pt-3 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
              {SOURCE_LABELS[note.source] ?? note.source}
            </p>
          </>
        )}
      </div>
    </ReferencePanel>
  );
}
