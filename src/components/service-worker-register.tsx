"use client";

import { useEffect } from "react";

/** Registers the offline-fallback service worker. No UI — side effect only. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration can fail (e.g. unsupported browser, private mode); the
      // app works fine without it, so there's nothing to surface here.
    });
  }, []);

  return null;
}
