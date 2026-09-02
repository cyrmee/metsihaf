"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ReferencePanelProps {
  /** Panel heading, e.g. "Cross-references". */
  title: string;
  /** The verse or passage this panel is about, e.g. "Genesis 1:1". */
  sourceLabel: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Shared shell for the verse-level side panels (cross-references, footnotes,
 * study notes). Below the `panel` breakpoint it's a centered modal over a
 * backdrop; at `panel` and up it becomes a `position: fixed` column pinned
 * a short 1.25rem gap outside the reading card's right edge (the card is
 * centered via `mx-auto max-w-3xl`, so `left: calc(50% + 24rem + 1.25rem)`
 * tracks that edge without needing to know the viewport width) and
 * top-aligned with the
 * card itself — masthead (5.25rem) + the page's own top padding (1.5rem) +
 * the book/chapter selector row (2.25rem tall, 2.5rem margin below it) —
 * instead of the masthead alone, so the panel starts level with the
 * reading card, not floating above the book/chapter selector. That keeps
 * the panel next to the passage it's about instead of drifting off toward
 * the viewport's edge on wide/ultrawide screens. `position: fixed` means it
 * stays in view through ordinary scrolling without extra sticky/order-first
 * plumbing.
 */
export function ReferencePanel({
  title,
  sourceLabel,
  open,
  onClose,
  children,
}: ReferencePanelProps) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Only the mobile/tablet presentation is a true modal that covers the
  // reading column, so only it should lock page scroll. At the `panel`
  // breakpoint the panel docks beside the card with its own independent
  // scrollbar — the page underneath must stay scrollable, or the reading
  // column becomes unusable while a reference panel is open.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 106.25rem)");
    const apply = () => {
      document.body.style.overflow = query.matches ? "" : "hidden";
    };
    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 panel:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed top-1/2 left-1/2 z-50 flex h-[min(38rem,85vh)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col border border-ink bg-paper shadow-[10px_10px_0_rgba(23,32,29,0.11)] panel:inset-x-auto panel:top-[11.5rem] panel:right-auto panel:left-[calc(50%+25.25rem)] panel:bottom-auto panel:h-auto panel:max-h-[calc(100vh-13rem)] panel:w-[26rem] panel:max-w-none panel:translate-x-0 panel:translate-y-0">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center border-b border-ink px-4 py-3">
          <span aria-hidden="true" />
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
            <p className="font-mono text-[10px] tracking-[0.06em] text-signal uppercase">
              {sourceLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-editorial flex h-8 w-8 items-center justify-center justify-self-end border border-ink text-ink hover:bg-ink hover:text-paper-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-size-adjust-none min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
