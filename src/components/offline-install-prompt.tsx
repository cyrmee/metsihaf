"use client";

import { useEffect, useRef } from "react";
import { Check, Download, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useOfflineDownload } from "@/hooks/use-offline-download";
import { useTranslations } from "@/lib/use-translations";
import { getInstallPromptDismissed, setInstallPromptDismissed } from "@/lib/local-store";

const TOAST_ID = "offline-install-prompt";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Toasts the two things that make this usable as a real offline app:
 * installing to the home screen, and downloading every verse and study
 * note so reading works with no connection at all.
 */
export function OfflineInstallPrompt() {
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const { start, downloading, progress, error, downloadedAt } = useOfflineDownload();
  const { translations } = useTranslations();
  const translationIds = translations.map((t) => t.id);
  const translationIdsKey = translationIds.join(",");

  const dismiss = () => {
    setInstallPromptDismissed(true);
    toast.dismiss(TOAST_ID);
  };

  const alreadySetUp = installed && downloadedAt !== null;
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || alreadySetUp || getInstallPromptDismissed()) return;
    shown.current = true;
  }, [alreadySetUp]);

  useEffect(() => {
    if (!shown.current || alreadySetUp) {
      toast.dismiss(TOAST_ID);
      return;
    }

    const showInstallRow = !installed;
    const showIosHint = showInstallRow && !canInstall && isIos();

    toast(
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Read offline</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Install Metsihaf as an app and download the full Bible and commentary, so it works with
            no connection.
          </p>
        </div>

        {showInstallRow && !showIosHint && canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="focus-editorial flex items-center gap-1.5 self-start bg-signal px-3 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase hover:bg-signal-hover"
          >
            <Smartphone className="h-3.5 w-3.5" /> Install app
          </button>
        )}
        {showIosHint && (
          <p className="flex items-center gap-1.5 border border-rule bg-field-inset px-3 py-2 text-xs text-muted-foreground">
            <Share className="h-3.5 w-3.5 shrink-0" /> To install: tap Share, then &ldquo;Add to
            Home Screen&rdquo;.
          </p>
        )}
        {installed && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-support" /> Installed
          </p>
        )}

        {downloadedAt === null ? (
          <button
            type="button"
            disabled={downloading || translationIds.length === 0}
            onClick={() => start(translationIds)}
            className="focus-editorial flex items-center gap-1.5 self-start bg-signal px-3 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase hover:bg-signal-hover disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading && progress
              ? `Downloading… ${progress.done}/${progress.total}`
              : "Download for offline"}
          </button>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-support" /> Downloaded for offline reading
          </p>
        )}
        {error && <p className="text-xs text-signal">{error}</p>}
      </div>,
      {
        id: TOAST_ID,
        duration: Infinity,
        onDismiss: dismiss,
        closeButton: true,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-render toast content on state changes without resetting its identity
  }, [
    alreadySetUp,
    installed,
    canInstall,
    downloading,
    progress,
    downloadedAt,
    error,
    translationIdsKey,
  ]);

  return null;
}
