"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  LANGUAGE_LABELS,
  TRANSLATION_NAMES,
  type LanguageId,
  type TranslationId,
} from "@/lib/bible";
import { useTranslations } from "@/lib/use-translations";
import { InlineSelect } from "@/components/inline-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TranslationSwitcherProps {
  value: TranslationId;
  onChange: (id: TranslationId) => void;
  size?: "sm" | "md";
}

/** Trigger button that opens a modal: pick a language, then a version in that language. */
export function TranslationSwitcher({ value, onChange, size = "md" }: TranslationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { translations, byId } = useTranslations();
  const current = byId[value];
  const [language, setLanguage] = useState<LanguageId>(current?.language ?? "en");

  // Re-sync the language filter to whatever's actually selected each time the modal opens.
  useEffect(() => {
    if (open && current) setLanguage(current.language);
  }, [open, current]);

  const languages = useMemo(
    () => Array.from(new Set(translations.map((t) => t.language))),
    [translations],
  );
  const versions = useMemo(
    () => translations.filter((t) => t.language === language),
    [translations, language],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={`focus-carbon flex items-center justify-center gap-1.5 rounded-full border border-border bg-card font-medium text-foreground transition-colors hover:bg-accent ${
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm"
        }`}
      >
        <span>{current?.id ?? value}</span>
        <ChevronDown className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </DialogTrigger>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="px-4 py-3.5 text-center">
          <DialogTitle className="text-base">Choose a translation</DialogTitle>
          <DialogDescription>Pick a language, then a version.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center px-4 pb-3">
          <div className="w-full max-w-[13rem]">
            <InlineSelect
              ariaLabel="Language"
              value={language}
              onChange={(l) => setLanguage(l as LanguageId)}
              options={languages.map((l) => ({ id: l, label: LANGUAGE_LABELS[l] ?? l }))}
            />
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
                className={`focus-carbon flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left transition-colors ${
                  active ? "bg-accent" : "hover:bg-accent/60"
                }`}
              >
                <span>
                  <span
                    className={`block text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}
                  >
                    {t.id}
                    {TRANSLATION_NAMES[t.id] && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        — {TRANSLATION_NAMES[t.id]}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {LANGUAGE_LABELS[t.language] ?? t.language}
                  </span>
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
