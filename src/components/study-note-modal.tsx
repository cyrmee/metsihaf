"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { StudyNote } from "@/lib/bible";

const SOURCE_LABELS: Record<string, string> = {
  "matthew-henry": "Matthew Henry Bible Commentary",
};

interface StudyNoteModalProps {
  /** The passage this note covers, e.g. "John 3:1-21". */
  sourceLabel: string;
  note: StudyNote | null;
  open: boolean;
  onClose: () => void;
}

/** Popup showing a public-domain commentary note anchored to a passage — same shell as FootnotesModal/CrossRefsModal. */
export function StudyNoteModal({ sourceLabel, note, open, onClose }: StudyNoteModalProps) {
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
            <h2 className="font-display text-xl font-semibold text-foreground">Study Note</h2>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {!note ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No study note for this verse.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold text-primary">
                {SOURCE_LABELS[note.source] ?? note.source}
              </p>
              {note.text
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i} className="mb-3 text-[0.95rem] leading-relaxed text-foreground">
                    {paragraph}
                  </p>
                ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
