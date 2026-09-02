"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, Download, Trash2 } from "lucide-react";
import { AccountSection } from "@/components/account-section";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useOfflineDownload } from "@/hooks/use-offline-download";
import { useTranslations } from "@/lib/use-translations";
import { clearStudyData } from "@/lib/local-store";

/** A ruled record group — the grouping unit for the whole page. Only the primary (first) group carries the hard shadow, so that signature keeps its authority instead of repeating down the page. */
function SettingsGroup({
  title,
  primary,
  children,
}: {
  title: string;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`border border-ink bg-paper ${primary ? "shadow-[10px_10px_0_rgba(23,32,29,0.11)]" : ""}`}
    >
      <h2 className="flex items-center gap-3 border-b border-ink px-4 py-2.5">
        <span className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
          {title} /
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-rule" />
      </h2>
      <div className="divide-y divide-rule">{children}</div>
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

/** Square-cornered disclosure, styled to match the ruled surfaces around it. */
function LegalDetails({ summary, children }: { summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-rule">
      <CollapsibleTrigger className="focus-editorial flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-field-neutral">
        {summary}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 border-t border-rule px-4 py-4 text-xs leading-relaxed text-muted-foreground">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SettingsClient() {
  const {
    start: startDownload,
    downloading,
    progress,
    error: downloadError,
    downloadedAt,
  } = useOfflineDownload();
  const { translations } = useTranslations();

  // The translation list always starts empty on both server and first
  // client render, then fills in after mount. Gating on `mounted` (instead
  // of `translations.length`) keeps the button's disabled state identical
  // across the two renders even if the fetch happens to settle unusually
  // fast, so it can't trigger a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const clearLocalData = () => {
    clearStudyData();
  };

  return (
    <div className="mx-auto max-w-2xl px-2 py-8 sm:px-4">
      <div>
        <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
          Settings / 04
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved on this device, or synced to your account if you sign in.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <SettingsGroup title="Account" primary>
          <div className="px-4 py-4">
            <AccountSection />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Data">
          <SettingsRow
            label="Local study data"
            description="Bookmarks, highlights, and notes saved on this device."
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm" className="shrink-0">
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
                    Advisory / destructive
                  </p>
                  <AlertDialogTitle>Clear local study data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all bookmarks, highlights and notes on this device. This can&apos;t
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearLocalData}
                    className="border border-rule bg-transparent text-ink hover:border-signal hover:bg-field-conflict hover:text-signal"
                  >
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SettingsRow>

          <SettingsRow
            label="Offline reading"
            description={
              downloadedAt
                ? `Every verse and study note is saved on this device (last updated ${new Date(downloadedAt).toLocaleDateString()}).`
                : "Download every verse and study note so the app works with no connection."
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloading || !mounted || translations.length === 0}
              onClick={() => startDownload(translations.map((t) => t.id))}
              className="shrink-0"
            >
              {downloadedAt && !downloading ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloading && progress
                ? `Downloading… ${progress.done}/${progress.total}`
                : downloadedAt
                  ? "Re-download"
                  : "Download for offline"}
            </Button>
          </SettingsRow>
          {downloadError && <p className="px-4 pb-4 text-xs text-destructive">{downloadError}</p>}
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
            <p className="font-medium text-foreground">Bible versions</p>
            <p>Amharic Bible (1954) © United Bible Societies, used for non-commercial personal study.</p>
            <p>Berean Standard Bible (BSB), public domain.</p>
            <p className="mt-2 font-medium text-foreground">Commentary</p>
            <p>Matthew Henry&apos;s Concise Commentary, public domain.</p>
            <p className="mt-2 font-medium text-foreground">Cross-references</p>
            <p>From OpenBible.info, licensed CC BY.</p>
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
