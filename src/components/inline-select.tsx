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
        className={`focus-editorial flex h-8 w-full items-center justify-between gap-2 border px-3 text-sm ${
          open
            ? "border-ink bg-field-neutral text-ink"
            : "border-[#b8b4aa] bg-paper-white text-ink hover:border-ink"
        }`}
      >
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-[calc(100%+0.25rem)] right-0 left-0 z-40 max-h-56 overflow-y-auto border border-ink bg-paper-white p-1 shadow-[10px_10px_0_rgba(23,32,29,0.11)]"
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
                className={`focus-editorial flex w-full items-center justify-between gap-2 border-l-2 px-2.5 py-2 text-left text-sm ${
                  active
                    ? "border-signal bg-field-neutral font-semibold text-signal"
                    : "border-transparent text-ink hover:bg-field-neutral"
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
