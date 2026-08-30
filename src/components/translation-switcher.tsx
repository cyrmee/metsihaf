"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  LANGUAGE_LABELS,
  TRANSLATIONS,
  TRANSLATION_BY_ID,
  type LanguageId,
  type TranslationId,
} from "@/lib/bible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const LANGUAGES = Array.from(new Set(TRANSLATIONS.map((t) => t.language)));

interface TranslationSwitcherProps {
  value: TranslationId;
  onChange: (id: TranslationId) => void;
  size?: "sm" | "md";
}

/** Trigger button that opens a modal: pick a language, then a version in that language. */
export function TranslationSwitcher({ value, onChange, size = "md" }: TranslationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageId>(TRANSLATION_BY_ID[value].language);
  const current = TRANSLATION_BY_ID[value];

  // Re-sync the language filter to whatever's actually selected each time the modal opens.
  useEffect(() => {
    if (open) setLanguage(TRANSLATION_BY_ID[value].language);
  }, [open, value]);

  const versions = useMemo(() => TRANSLATIONS.filter((t) => t.language === language), [language]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={`focus-carbon flex items-center justify-center gap-1.5 border border-border bg-card font-medium text-foreground transition-colors hover:bg-accent ${
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm"
        }`}
      >
        <span>{size === "sm" ? (current?.label ?? value) : (current?.name ?? value)}</span>
        <ChevronDown className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </DialogTrigger>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="px-4 py-3.5 text-center">
          <DialogTitle className="text-base">Choose a translation</DialogTitle>
          <DialogDescription>Pick a language, then a version.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center px-4 pb-3">
          <label htmlFor="translation-language" className="sr-only">
            Language
          </label>
          <div className="relative w-full max-w-[13rem]">
            <select
              id="translation-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageId)}
              className="focus-carbon w-full appearance-none bg-card px-3 py-2.5 text-center text-sm font-medium text-foreground"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1">
          {versions.map((t) => {
            const active = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                className={`focus-carbon flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                  active ? "bg-accent" : "hover:bg-accent/60"
                }`}
              >
                <span>
                  <span
                    className={`block text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}
                  >
                    {t.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{t.name}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
