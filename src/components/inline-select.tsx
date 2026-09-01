"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface InlineSelectOption<T extends string> {
  id: T;
  label: string;
  /** Optional inline style for the option row (e.g. a font-family preview). */
  style?: React.CSSProperties;
}

interface InlineSelectProps<T extends string> {
  value: T;
  options: InlineSelectOption<T>[];
  onChange: (id: T) => void;
  ariaLabel: string;
  /** Inline style for the trigger button (e.g. a font-family preview of the current pick). */
  triggerStyle?: React.CSSProperties;
  className?: string;
}

/**
 * A fully custom (non-native) dropdown — a bordered trigger button that opens
 * a floating option list on click, closed on outside click or selection.
 * Used wherever a `<select>` would otherwise appear, since the app avoids
 * native form controls everywhere for consistent styling across browsers.
 */
export function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  triggerStyle,
  className = "",
}: InlineSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={triggerStyle}
        className={`focus-carbon flex h-8 w-full items-center justify-between gap-2 rounded-full border px-3 text-sm ${
          open
            ? "border-primary bg-accent text-primary"
            : "border-border bg-card text-foreground hover:bg-accent"
        }`}
      >
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-[calc(100%+0.25rem)] right-0 left-0 z-40 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card p-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)]"
        >
          {options.map((opt) => {
            const active = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                style={opt.style}
                className={`focus-carbon flex w-full items-center justify-between gap-2 rounded-full border px-2.5 py-2 text-left text-sm ${
                  active
                    ? "border-primary bg-accent text-primary"
                    : "border-transparent text-foreground hover:border-border hover:bg-accent/60"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
