import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { downloadAllOffline, type DownloadProgress } from "@/lib/offline-download";
import { getOfflineDownloadedAt, setOfflineDownloadedAt } from "@/lib/local-store";
import type { TranslationId } from "@/lib/bible";

/** Drives the "download every verse and study note for offline reading" flow, shared by the install banner and the settings page. */
export function useOfflineDownload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Starts null (matching the server-rendered markup) and is filled in after
  // mount — localStorage isn't available during SSR, and reading it in the
  // initializer would make the client's first render diverge from the
  // server's, causing a hydration mismatch.
  const [downloadedAt, setDownloadedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setDownloadedAt(getOfflineDownloadedAt());
  }, []);

  const start = useCallback(
    async (translations: TranslationId[]) => {
      setError(null);
      const controller = new AbortController();
      abortRef.current = controller;
      setProgress({ done: 0, total: translations.length ? 1 : 0 });
      try {
        await downloadAllOffline(queryClient, translations, setProgress, controller.signal);
        if (!controller.signal.aborted) {
          const at = Date.now();
          setOfflineDownloadedAt(at);
          setDownloadedAt(at);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Download failed");
        }
      } finally {
        setProgress(null);
      }
    },
    [queryClient],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setProgress(null);
  }, []);

  return {
    start,
    cancel,
    progress,
    downloading: progress !== null,
    error,
    downloadedAt,
  };
}
