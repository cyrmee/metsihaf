"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOK_BY_ID, formatRef } from "@/data/books";
import { ReferencePanel } from "@/components/reference-panel";

async function getVerseTexts(
  translation: string,
  refs: string[],
): Promise<Record<string, string | null>> {
  if (refs.length === 0) return {};
  const params = new URLSearchParams({ translation, refs: refs.join(",") });
  const res = await fetch(`/api/verse-text?${params.toString()}`);
  if (!res.ok) return {};
  const body = (await res.json()) as { texts?: Record<string, string | null> };
  return body.texts ?? {};
}

interface CrossRefsModalProps {
  /** The verse these cross-references belong to, e.g. "Genesis 1:1". */
  sourceLabel: string;
  /** Version to fetch preview text from — the one the source verse is being read in. */
  translation: string;
  refs: string[];
  open: boolean;
  onClose: () => void;
  /** Reader font size in px, matched to the bible text's current setting. */
  fontSize?: number;
}

interface RefEntry {
  ref: string;
  book: string;
  chapter: string;
  verse: string;
  text: string | null;
}

/** Popup listing every cross-reference for a verse, with a text preview for each. */
export function CrossRefsModal({
  sourceLabel,
  translation,
  refs,
  open,
  onClose,
  fontSize,
}: CrossRefsModalProps) {
  const [entries, setEntries] = useState<RefEntry[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setEntries(null);
    let cancelled = false;
    (async () => {
      const texts = await getVerseTexts(translation, refs);
      const resolved = refs.map((target) => {
        const [book, chapter, verse] = target.split(".");
        return {
          ref: target,
          book: book ?? "",
          chapter: chapter ?? "",
          verse: verse ?? "",
          text: texts[target] ?? null,
        };
      });
      if (!cancelled) setEntries(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, refs, translation]);

  return (
    <ReferencePanel
      title="Cross-references"
      sourceLabel={sourceLabel}
      open={open}
      onClose={onClose}
    >
      {entries === null && (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      )}
      {entries && entries.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No cross-references for this verse.
        </p>
      )}
      {entries && (
        <ul className="flex flex-col">
          {entries.map((e, i) => {
            if (!BOOK_BY_ID[e.book]) return null;
            return (
              <li key={e.ref} className={i > 0 ? "border-t border-rule" : ""}>
                <Link
                  href={`/read/${e.book}/${e.chapter}#v${e.verse}`}
                  onClick={onClose}
                  className="focus-editorial block px-4 py-3 hover:bg-field-neutral"
                >
                  <span className="font-mono text-[11px] font-semibold text-signal uppercase">
                    {formatRef(e.ref)}
                  </span>
                  {e.text && (
                    <p
                      className="font-ethiopic mt-1 leading-relaxed text-foreground"
                      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
                    >
                      {e.text}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </ReferencePanel>
  );
}
