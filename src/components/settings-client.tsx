"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, Moon, Sun, Trash2 } from "lucide-react";
import { InlineSelect } from "@/components/inline-select";
import { AccountSection } from "@/components/account-section";
import {
  AMHARIC_FONT_STACKS,
  clearStudyData,
  ENGLISH_FONT_STACKS,
  getAmharicFont,
  getDarkMode,
  getEnglishFont,
  getFontSize,
  getLetterSpacing,
  getLineSpacing,
  setAmharicFont,
  setDarkMode,
  setEnglishFont,
  setFontSize,
  setLetterSpacing,
  setLineSpacing,
  type AmharicFont,
  type EnglishFont,
  type LetterSpacing,
  type LineSpacing,
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
const ENGLISH_FONTS: { id: EnglishFont; label: string }[] = [
  { id: "sourceSerif", label: "Source Serif" },
  { id: "literata", label: "Literata" },
  { id: "merriweather", label: "Merriweather" },
  { id: "lora", label: "Lora" },
  { id: "crimsonPro", label: "Crimson Pro" },
  { id: "plexSans", label: "Plex Sans" },
];
const AMHARIC_FONTS: { id: AmharicFont; label: string }[] = [
  { id: "notoSerif", label: "Noto Serif" },
  { id: "notoSans", label: "Noto Sans" },
  { id: "abyssinica", label: "Abyssinica" },
];

/** A bordered card — the grouping unit for the whole page. */
function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-2.5 font-display text-sm font-medium text-foreground">
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

/** Rounded disclosure, styled to match the cards around it. */
function LegalDetails({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-md border border-border">
      <summary className="focus-carbon flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground marker:content-none">
        {summary}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export function SettingsClient() {
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSizeState] = useState(18);
  const [lineSpacing, setLineSpacingState] = useState<LineSpacing>("normal");
  const [letterSpacing, setLetterSpacingState] = useState<LetterSpacing>("normal");
  const [englishFont, setEnglishFontState] = useState<EnglishFont>("sourceSerif");
  const [amharicFont, setAmharicFontState] = useState<AmharicFont>("notoSerif");

  useEffect(() => {
    setDark(getDarkMode());
    setFontSizeState(getFontSize());
    setLineSpacingState(getLineSpacing());
    setLetterSpacingState(getLetterSpacing());
    setEnglishFontState(getEnglishFont());
    setAmharicFontState(getAmharicFont());
  }, []);

  const changeDark = (on: boolean) => {
    setDark(on);
    setDarkMode(on);
    document.documentElement.classList.toggle("dark", on);
  };

  const changeFontSize = (size: number) => {
    setFontSizeState(size);
    setFontSize(size);
  };

  const changeLineSpacing = (spacing: LineSpacing) => {
    setLineSpacingState(spacing);
    setLineSpacing(spacing);
  };

  const changeLetterSpacing = (spacing: LetterSpacing) => {
    setLetterSpacingState(spacing);
    setLetterSpacing(spacing);
  };

  const changeEnglishFont = (font: EnglishFont) => {
    setEnglishFontState(font);
    setEnglishFont(font);
  };

  const changeAmharicFont = (font: AmharicFont) => {
    setAmharicFontState(font);
    setAmharicFont(font);
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

      <div className="mt-8 flex flex-col gap-6">
        <SettingsGroup title="Appearance">
          <SettingsRow label="Dark mode">
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              onClick={() => changeDark(!dark)}
              className={`focus-carbon flex h-8 w-14 shrink-0 items-center rounded-full border px-1 transition-colors ${
                dark ? "border-primary bg-primary" : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background transition-transform ${
                  dark ? "translate-x-6" : "translate-x-0"
                }`}
              >
                {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </span>
            </button>
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
                  className={`focus-carbon flex h-11 w-11 items-center justify-center rounded-md border font-serif ${
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

          <SettingsRow label="English font">
            <InlineSelect
              className="max-w-xs"
              ariaLabel="English font"
              value={englishFont}
              onChange={(id) => changeEnglishFont(id as EnglishFont)}
              triggerStyle={{ fontFamily: ENGLISH_FONT_STACKS[englishFont] }}
              options={ENGLISH_FONTS.map((f) => ({
                id: f.id,
                label: f.label,
                style: { fontFamily: ENGLISH_FONT_STACKS[f.id] },
              }))}
            />
          </SettingsRow>

          <SettingsRow label="Amharic font">
            <InlineSelect
              className="max-w-xs"
              ariaLabel="Amharic font"
              value={amharicFont}
              onChange={(id) => changeAmharicFont(id as AmharicFont)}
              triggerStyle={{ fontFamily: AMHARIC_FONT_STACKS[amharicFont] }}
              options={AMHARIC_FONTS.map((f) => ({
                id: f.id,
                label: f.label,
                style: { fontFamily: AMHARIC_FONT_STACKS[f.id] },
              }))}
            />
          </SettingsRow>

          <SettingsRow label="Line spacing">
            <div className="flex items-center gap-1.5" role="group" aria-label="Line spacing">
              {LINE_SPACINGS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeLineSpacing(s.id)}
                  aria-pressed={lineSpacing === s.id}
                  className={`focus-carbon flex h-11 w-24 items-center justify-center rounded-md border text-sm font-medium ${
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
                  className={`focus-carbon flex h-11 w-24 items-center justify-center rounded-md border text-sm font-medium ${
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
              className="focus-carbon flex shrink-0 items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="About">
          <div className="flex flex-col gap-3 px-4 py-4 text-sm">
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

          <div className="flex flex-col gap-1.5 px-4 py-4 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Sources &amp; credits</p>
            <p>
              Amharic Bible text © United Bible Societies, used for non-commercial personal study.
            </p>
            <p>Cross-references from OpenBible.info, licensed CC BY.</p>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4">
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
