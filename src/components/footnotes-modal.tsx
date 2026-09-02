"use client";

import type { Footnote } from "@/lib/bible";
import { ReferencePanel } from "@/components/reference-panel";

interface FootnotesModalProps {
  /** The verse these footnotes belong to, e.g. "Genesis 1:1". */
  sourceLabel: string;
  footnotes: Footnote[];
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

/** Popup listing a verse's translator footnotes, lettered a/b/c in text order. */
export function FootnotesModal({
  sourceLabel,
  footnotes,
  open,
  onClose,
  fontSize,
  fontFamily,
  lineHeight,
  letterSpacing,
}: FootnotesModalProps) {
  return (
    <ReferencePanel title="Footnotes" sourceLabel={sourceLabel} open={open} onClose={onClose}>
      {footnotes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No footnotes for this verse.
        </p>
      ) : (
        <ul className="flex flex-col">
          {footnotes.map((f, i) => (
            <li key={f.at} className={`px-4 py-3 ${i > 0 ? "border-t border-rule" : ""}`}>
              <span className="font-mono text-xs font-bold text-signal uppercase">
                {String.fromCharCode(97 + i)}
              </span>
              <p
                className="mt-1 leading-relaxed text-foreground"
                style={{
                  fontSize: fontSize ? `${fontSize}px` : undefined,
                  fontFamily,
                  lineHeight,
                  letterSpacing,
                }}
              >
                {f.note}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ReferencePanel>
  );
}
