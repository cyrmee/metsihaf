"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { Footnote } from "@/lib/bible";

interface FootnotesModalProps {
  /** The verse these footnotes belong to, e.g. "Genesis 1:1". */
  sourceLabel: string;
  footnotes: Footnote[];
  open: boolean;
  onClose: () => void;
}

/** Popup listing a verse's translator footnotes, lettered a/b/c in text order — same shell as CrossRefsModal. */
export function FootnotesModal({ sourceLabel, footnotes, open, onClose }: FootnotesModalProps) {
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
      <div className="fixed top-1/2 left-1/2 z-50 flex h-[min(38rem,85vh)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center px-4 py-3">
          <span aria-hidden="true" />
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">Footnotes</h2>
            <p className="text-xs text-muted-foreground">{sourceLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-carbon flex h-8 w-8 items-center justify-center justify-self-end rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {footnotes.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No footnotes for this verse.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5 px-3 py-2">
              {footnotes.map((f, i) => (
                <li key={f.at} className="rounded-md bg-card px-4 py-3">
                  <span className="text-xs font-semibold text-primary">
                    {String.fromCharCode(97 + i)}
                  </span>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-foreground">{f.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
