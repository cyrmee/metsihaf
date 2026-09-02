"use client";

import { useEffect } from "react";

import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
              System / 00
            </p>
            <h1 className="mt-2 font-display text-xl font-medium text-foreground">
              This page didn&apos;t load
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong on our end. You can try refreshing or head back home.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex items-center justify-center bg-signal px-4 py-2 font-mono text-[11px] font-bold tracking-[0.08em] text-paper-white uppercase transition-colors hover:bg-signal-hover"
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload to escape a broken render tree */}
              <a
                href="/"
                className="inline-flex items-center justify-center border border-ink px-4 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-paper-white"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
