"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { BOOK_BY_ID, formatRef } from "@/data/books";

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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-1/2 left-1/2 z-50 flex h-[min(38rem,85vh)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border/50 bg-card/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center px-4 py-3">
          <span aria-hidden="true" />
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">Cross-references</h2>
            <p className="text-xs text-muted-foreground">{sourceLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-carbon flex h-8 w-8 items-center justify-center justify-self-end rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {entries === null && (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {entries && entries.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No cross-references for this verse.
            </p>
          )}
          {entries && (
            <ul className="flex flex-col gap-1.5 px-3 py-2">
              {entries.map((e) => {
                if (!BOOK_BY_ID[e.book]) return null;
                return (
                  <li key={e.ref}>
                    <Link
                      href={`/read/${e.book}/${e.chapter}#v${e.verse}`}
                      onClick={onClose}
                      className="focus-carbon block rounded-2xl bg-card px-4 py-3 hover:bg-accent"
                    >
                      <span className="text-xs font-semibold text-primary">{formatRef(e.ref)}</span>
                      {e.text && (
                        <p className="font-ethiopic mt-1 text-[0.95rem] leading-relaxed text-foreground">
                          {e.text}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
