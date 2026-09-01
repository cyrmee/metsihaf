"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, Moon, Pilcrow, Rows3, Sun, Trash2 } from "lucide-react";
import { TranslationSwitcher } from "@/components/translation-switcher";
import { AccountSection } from "@/components/account-section";
import { LANGUAGE_LABELS, type TranslationId } from "@/lib/bible";
import { useTranslations } from "@/lib/use-translations";
import {
  clearStudyData,
  getAccentTheme,
  getDarkMode,
  getFontSize,
  getLetterSpacing,
  getLineSpacing,
  getPreferredTranslation,
  getShowVerseSelector,
  getVerseView,
  setAccentTheme,
  setDarkMode,
  setFontSize,
  setLetterSpacing,
  setLineSpacing,
  setPreferredTranslation,
  setShowVerseSelector,
  setVerseView,
  type AccentTheme,
  type LetterSpacing,
  type LineSpacing,
  type VerseViewMode,
} from "@/lib/local-store";

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

/** Preview swatch values — mirror the light-mode oklch values in globals.css. */
const THEME_COLORS: { id: AccentTheme; label: string; swatch: string }[] = [
  { id: "red", label: "Red", swatch: "oklch(0.47 0.17 29)" },
  { id: "orange", label: "Orange", swatch: "oklch(0.58 0.16 55)" },
  { id: "yellow", label: "Yellow", swatch: "oklch(0.62 0.13 85)" },
  { id: "green", label: "Green", swatch: "oklch(0.45 0.09 145)" },
  { id: "teal", label: "Teal", swatch: "oklch(0.5 0.09 195)" },
  { id: "blue", label: "Blue", swatch: "oklch(0.48 0.13 245)" },
  { id: "purple", label: "Purple", swatch: "oklch(0.5 0.12 305)" },
  { id: "pink", label: "Pink", swatch: "oklch(0.55 0.16 340)" },
  { id: "brown", label: "Brown", swatch: "oklch(0.42 0.07 50)" },
];

/** A bordered "manuscript page" panel — the grouping unit for the whole page. */
function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-border bg-card">
      <h2 className="border-b border-border px-4 py-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

/** One control inside a group — label on top, control left-aligned below it. */
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-3">
        <div className="text-sm text-foreground">{label}</div>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/** Sharp-cornered disclosure, styled to match the manuscript panels around it. */
function LegalDetails({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group border border-border">
      <summary className="focus-carbon flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground marker:content-none">
        {summary}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border px-4 py-4 text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export function SettingsClient() {
  const [dark, setDark] = useState(false);
  const [accent, setAccentState] = useState<AccentTheme>("red");
  const [fontSize, setFontSizeState] = useState(18);
  const [viewMode, setViewModeState] = useState<VerseViewMode>("line");
  const [lineSpacing, setLineSpacingState] = useState<LineSpacing>("normal");
  const [letterSpacing, setLetterSpacingState] = useState<LetterSpacing>("normal");
  const [translation, setTranslationState] = useState<TranslationId>("HSAB");
  const [showVerseSelector, setShowVerseSelectorState] = useState(false);
  const { byId } = useTranslations();

  useEffect(() => {
    setDark(getDarkMode());
    setAccentState(getAccentTheme());
    setFontSizeState(getFontSize());
    setViewModeState(getVerseView());
    setLineSpacingState(getLineSpacing());
    setLetterSpacingState(getLetterSpacing());
    setTranslationState(getPreferredTranslation() as TranslationId);
    setShowVerseSelectorState(getShowVerseSelector());
  }, []);

  const changeDark = (on: boolean) => {
    setDark(on);
    setDarkMode(on);
    document.documentElement.classList.toggle("dark", on);
  };

  const changeAccent = (theme: AccentTheme) => {
    setAccentState(theme);
    setAccentTheme(theme);
    document.documentElement.setAttribute("data-accent", theme);
  };

  const changeFontSize = (size: number) => {
    setFontSizeState(size);
    setFontSize(size);
  };

  const changeViewMode = (mode: VerseViewMode) => {
    setViewModeState(mode);
    setVerseView(mode);
  };

  const changeShowVerseSelector = (on: boolean) => {
    setShowVerseSelectorState(on);
    setShowVerseSelector(on);
  };

  const changeLineSpacing = (spacing: LineSpacing) => {
    setLineSpacingState(spacing);
    setLineSpacing(spacing);
  };

  const changeLetterSpacing = (spacing: LetterSpacing) => {
    setLetterSpacingState(spacing);
    setLetterSpacing(spacing);
  };

  const changeTranslation = (id: TranslationId) => {
    setTranslationState(id);
    setPreferredTranslation(id);
  };

  const clearLocalData = () => {
    if (
      !window.confirm(
        "Clear all bookmarks, highlights and notes on this device? This can't be undone.",
      )
    ) {
      return;
    }
    clearStudyData();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved on this device, or synced to your account if you sign in.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <SettingsGroup title="Appearance">
          <SettingsRow label="Dark mode">
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              onClick={() => changeDark(!dark)}
              className={`focus-carbon flex h-8 w-14 shrink-0 items-center border px-1 transition-colors ${
                dark ? "border-primary bg-primary" : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center bg-background text-foreground transition-transform ${
                  dark ? "translate-x-6" : "translate-x-0"
                }`}
              >
                {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </span>
            </button>
          </SettingsRow>

          <SettingsRow label="Theme color">
            <div className="flex flex-wrap gap-3" role="group" aria-label="Theme color">
              {THEME_COLORS.map((t) => {
                const active = accent === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => changeAccent(t.id)}
                    aria-pressed={active}
                    aria-label={t.label}
                    className="focus-carbon flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        active ? "border-foreground" : "border-transparent"
                      }`}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: t.swatch }}
                      >
                        {active && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Reading">
          <SettingsRow label="Text size">
            <div className="flex items-center gap-1.5">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => changeFontSize(size)}
                  aria-label={`Text size ${size}`}
                  aria-pressed={fontSize === size}
                  className={`focus-carbon flex h-11 w-11 items-center justify-center border font-serif ${
                    fontSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-accent"
                  }`}
                  style={{ fontSize: `${Math.min(size, 20)}px` }}
                >
                  A
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow label="Line spacing">
            <div className="flex items-center gap-1.5" role="group" aria-label="Line spacing">
              {LINE_SPACINGS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeLineSpacing(s.id)}
                  aria-pressed={lineSpacing === s.id}
                  className={`focus-carbon flex h-11 w-24 items-center justify-center border text-sm font-medium ${
                    lineSpacing === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-accent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow label="Letter spacing">
            <div className="flex items-center gap-1.5" role="group" aria-label="Letter spacing">
              {LETTER_SPACINGS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeLetterSpacing(s.id)}
                  aria-pressed={letterSpacing === s.id}
                  className={`focus-carbon flex h-11 w-24 items-center justify-center border text-sm font-medium ${
                    letterSpacing === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-accent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </SettingsRow>

          <SettingsRow label="Layout">
            <div
              className="flex items-center gap-1.5 shrink-0"
              role="group"
              aria-label="Verse layout"
            >
              <button
                type="button"
                onClick={() => changeViewMode("line")}
                aria-label="Verse per line"
                aria-pressed={viewMode === "line"}
                title="Verse per line"
                className={`focus-carbon flex h-11 w-11 items-center justify-center border ${
                  viewMode === "line"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-accent"
                }`}
              >
                <Rows3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeViewMode("paragraph")}
                aria-label="Paragraph"
                aria-pressed={viewMode === "paragraph"}
                title="Paragraph"
                className={`focus-carbon flex h-11 w-11 items-center justify-center border ${
                  viewMode === "paragraph"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-accent"
                }`}
              >
                <Pilcrow className="h-4 w-4" />
              </button>
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Translation & navigation">
          <SettingsRow label="Default translation">
            <div className="flex flex-col items-start gap-1">
              <TranslationSwitcher value={translation} onChange={changeTranslation} size="sm" />
              <span className="text-xs text-muted-foreground">
                {LANGUAGE_LABELS[byId[translation]?.language ?? ""] ?? byId[translation]?.language}
              </span>
            </div>
          </SettingsRow>

          <SettingsRow
            label="Verse selector"
            description="Add a verse step to the book/chapter picker. Off by default, jumping straight to the start of a chapter."
          >
            <button
              type="button"
              role="switch"
              aria-checked={showVerseSelector}
              onClick={() => changeShowVerseSelector(!showVerseSelector)}
              className={`focus-carbon flex h-8 w-14 shrink-0 items-center border px-1 transition-colors ${
                showVerseSelector ? "border-primary bg-primary" : "border-border bg-card"
              }`}
            >
              <span
                className={`h-6 w-6 bg-background transition-transform ${
                  showVerseSelector ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Account">
          <div className="px-4 py-4">
            <AccountSection />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Data">
          <SettingsRow
            label="Local study data"
            description="Bookmarks, highlights, and notes saved on this device."
          >
            <button
              type="button"
              onClick={clearLocalData}
              className="focus-carbon flex shrink-0 items-center gap-1.5 border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="About">
          <div className="space-y-3 px-4 py-4 text-sm">
            <p className="text-foreground">
              <span className="font-display text-base font-semibold">Metsihaf</span>{" "}
              <span className="font-ethiopic text-muted-foreground">(መጽሐፍ)</span> — Amharic for
              &ldquo;book&rdquo; or &ldquo;scripture&rdquo; — is a Bible reader built around the
              Amharic 1954 translation, with cross-references, search, and personal study tools.
              More translations are coming soon.
            </p>
            <p className="text-muted-foreground">
              Your bookmarks, highlights, and notes stay with you: on this device by default, or
              synced to an account if you sign in. There are no ads and nothing here tracks you for
              advertising.
            </p>
          </div>

          <div className="space-y-1.5 px-4 py-4 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Sources &amp; credits</p>
            <p>
              Amharic Bible text © United Bible Societies, used for non-commercial personal study.
            </p>
            <p>Cross-references from OpenBible.info, licensed CC BY.</p>
          </div>

          <div className="space-y-3 px-4 py-4">
            <LegalDetails summary="Privacy policy">
              <p>Last updated August 30, 2026.</p>
              <p>
                <span className="font-medium text-foreground">On your device.</span> Your reading
                position, text size, theme, and layout preferences are saved to this browser&apos;s
                local storage. They never leave your device unless you sign in.
              </p>
              <p>
                <span className="font-medium text-foreground">If you sign in.</span> An account lets
                your bookmarks, highlights, notes, reading position, and preferences follow you
                across devices. We store the email address you sign in with and the content you
                create — the verse references you bookmark or highlight, the text of notes you
                write, and your last-read position. We don&apos;t keep a browsing history beyond
                that last position.
              </p>
              <p>
                <span className="font-medium text-foreground">What we don&apos;t do.</span> No ads,
                no third-party trackers, no analytics that identify you, and we never sell or share
                your data.
              </p>
              <p>
                <span className="font-medium text-foreground">Deleting your data.</span> Clearing
                local data above removes it from this device immediately. To delete your account and
                everything tied to it, contact us at{" "}
                <a href="mailto:cyrmee@gmail.com" className="text-primary underline">
                  cyrmee@gmail.com
                </a>
                .
              </p>
            </LegalDetails>

            <LegalDetails summary="Terms of use">
              <p>Last updated August 30, 2026.</p>
              <p>Metsihaf is provided free of charge, as is, for personal Bible study.</p>
              <p>
                Bible text is used under the terms of its rights holder, United Bible Societies.
                Please respect that license if you copy text elsewhere.
              </p>
              <p>
                Don&apos;t use the app to scrape, bulk-download, or redistribute the Bible text it
                serves.
              </p>
              <p>
                We may update these terms or change the app&apos;s features over time. Continuing to
                use Metsihaf after a change means you accept the current terms.
              </p>
              <p>
                We do our best to keep the text accurate and the service available, but Metsihaf
                comes with no warranty, and we aren&apos;t liable for damages arising from its use
                or unavailability.
              </p>
            </LegalDetails>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}
