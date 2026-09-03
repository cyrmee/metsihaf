"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { InlineSelect } from "@/components/inline-select";
import { AMHARIC_FONT_STACKS, ENGLISH_FONT_STACKS } from "@/lib/local-store";
import type { AmharicFont, EnglishFont, LetterSpacing, LineSpacing } from "@/lib/local-store";

const FONT_SIZES = [15, 17, 19, 22, 25];
const LINE_SPACINGS: { id: LineSpacing; label: string }[] = [
  { id: "tight", label: "Tight" },
  { id: "normal", label: "Normal" },
  { id: "relaxed", label: "Relaxed" },
];
const LETTER_SPACINGS: { id: LetterSpacing; label: string }[] = [
  { id: "tight", label: "Tight" },
  { id: "normal", label: "Normal" },
  { id: "wide", label: "Wide" },
];

interface FontOption {
  id: string;
  label: string;
  style: { fontFamily: string };
}

interface ReadingSettingsDialogProps {
  fontSize: number;
  onStepFontSize: (delta: 1 | -1) => void;
  language: string;
  amharicFont: AmharicFont;
  englishFont: EnglishFont;
  fontOptions: FontOption[];
  onChangeAmharicFont: (font: AmharicFont) => void;
  onChangeEnglishFont: (font: EnglishFont) => void;
  lineSpacing: LineSpacing;
  onChangeLineSpacing: (spacing: LineSpacing) => void;
  letterSpacing: LetterSpacing;
  onChangeLetterSpacing: (spacing: LetterSpacing) => void;
  onClose: () => void;
}

/**
 * The text-size/font/spacing dialog opened from the reading toolbar. Split
 * out into its own module (loaded via `next/dynamic`) so this settings UI —
 * only needed once a reader actually opens it — doesn't add to the JS that
 * has to load before chapter text can render.
 */
export function ReadingSettingsDialog({
  fontSize,
  onStepFontSize,
  language,
  amharicFont,
  englishFont,
  fontOptions,
  onChangeAmharicFont,
  onChangeEnglishFont,
  lineSpacing,
  onChangeLineSpacing,
  letterSpacing,
  onChangeLetterSpacing,
  onClose,
}: ReadingSettingsDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const fontSizeIndex = Math.max(0, FONT_SIZES.indexOf(fontSize));

  return (
    <>
      <div
        className="animate-in fade-in-0 fixed inset-0 z-[60] bg-black/50 duration-150"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reading settings"
        className="animate-in zoom-in-95 fixed top-1/2 left-1/2 z-[60] max-h-[85vh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink bg-paper shadow-[10px_10px_0_rgba(23,32,29,0.11)] duration-150"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-ink bg-paper px-4 py-3">
          <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
            Reading settings
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-editorial flex h-8 w-8 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
            Text size
          </p>
          <div className="flex items-center border border-ink">
            <button
              type="button"
              onClick={() => onStepFontSize(-1)}
              disabled={fontSizeIndex === 0}
              aria-label="Decrease text size"
              className="focus-editorial flex h-9 w-9 shrink-0 items-center justify-center border-r border-ink font-mono text-base text-ink hover:bg-ink hover:text-paper-white disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
            >
              −
            </button>
            <div
              className="flex flex-1 items-center justify-center font-serif text-ink"
              style={{ fontSize: `${Math.min(fontSize, 19)}px` }}
              aria-hidden="true"
            >
              A
            </div>
            <button
              type="button"
              onClick={() => onStepFontSize(1)}
              disabled={fontSizeIndex === FONT_SIZES.length - 1}
              aria-label="Increase text size"
              className="focus-editorial flex h-9 w-9 shrink-0 items-center justify-center border-l border-ink font-mono text-base text-ink hover:bg-ink hover:text-paper-white disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
            >
              +
            </button>
          </div>
          <p
            className="mb-3 flex items-center justify-between pt-1.5 font-mono text-[10px] tracking-[0.06em] text-muted"
            aria-live="polite"
          >
            <span>
              SIZE {fontSizeIndex + 1}/{FONT_SIZES.length}
            </span>
            <span>{fontSize}PX</span>
          </p>

          <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
            Font
          </p>
          <InlineSelect
            className="mb-3"
            ariaLabel="Font"
            value={language === "am" ? amharicFont : englishFont}
            onChange={(id) =>
              language === "am"
                ? onChangeAmharicFont(id as AmharicFont)
                : onChangeEnglishFont(id as EnglishFont)
            }
            triggerStyle={{
              fontFamily:
                language === "am"
                  ? AMHARIC_FONT_STACKS[amharicFont]
                  : ENGLISH_FONT_STACKS[englishFont],
            }}
            options={fontOptions}
          />

          <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
            Line spacing
          </p>
          <div
            className="mb-3 flex items-center border border-ink"
            role="group"
            aria-label="Line spacing"
          >
            {LINE_SPACINGS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeLineSpacing(s.id)}
                aria-pressed={lineSpacing === s.id}
                className={`focus-editorial flex h-8 flex-1 items-center justify-center text-xs ${i > 0 ? "border-l border-ink" : ""} ${
                  lineSpacing === s.id
                    ? "bg-ink text-paper-white"
                    : "text-ink hover:bg-field-neutral"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
            Letter spacing
          </p>
          <div
            className="flex items-center border border-ink"
            role="group"
            aria-label="Letter spacing"
          >
            {LETTER_SPACINGS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeLetterSpacing(s.id)}
                aria-pressed={letterSpacing === s.id}
                className={`focus-editorial flex h-8 flex-1 items-center justify-center text-xs ${i > 0 ? "border-l border-ink" : ""} ${
                  letterSpacing === s.id
                    ? "bg-ink text-paper-white"
                    : "text-ink hover:bg-field-neutral"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
