"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, NotebookPen, Highlighter, Trash2 } from "lucide-react";
import { formatRef } from "@/data/books";
import {
  getBookmarks,
  getHighlights,
  getNotes,
  setHighlight,
  setNote,
  toggleBookmark,
} from "@/lib/local-store";
import { useStoreVersion } from "@/lib/use-store-version";

type Tab = "bookmarks" | "highlights" | "notes";

const TABS: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "highlights", label: "Highlights", icon: Highlighter },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

export function LibraryClient() {
  const [tab, setTab] = useState<Tab>("bookmarks");
  useStoreVersion();

  const bookmarks = getBookmarks();
  const highlights = getHighlights();
  const notes = getNotes();

  const counts: Record<Tab, number> = {
    bookmarks: bookmarks.length,
    highlights: highlights.length,
    notes: notes.length,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          My Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved on this device only — nothing leaves your browser.
        </p>
      </div>

      <div className="mt-6 flex justify-center gap-1" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`focus-carbon flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className="text-xs text-muted-foreground">({counts[t.id]})</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "bookmarks" && (
          <EntryList
            empty="No bookmarks yet. Tap a verse while reading to bookmark it."
            items={bookmarks.map((b) => ({
              ref: b.ref,
              onRemove: () => toggleBookmark(b.ref),
            }))}
          />
        )}
        {tab === "highlights" && (
          <EntryList
            empty="No highlights yet. Tap a verse and pick a color."
            items={highlights.map((h) => ({
              ref: h.ref,
              badge: h.color,
              onRemove: () => setHighlight(h.ref, null),
            }))}
          />
        )}
        {tab === "notes" && (
          <EntryList
            empty="No notes yet. Tap a verse while reading to write one."
            items={notes.map((n) => ({
              ref: n.ref,
              body: n.text,
              onRemove: () => setNote(n.ref, ""),
            }))}
          />
        )}
      </div>
    </div>
  );
}

interface EntryItem {
  ref: string;
  body?: string;
  badge?: string;
  onRemove: () => void;
}

function EntryList({ items, empty }: { items: EntryItem[]; empty: string }) {
  if (items.length === 0) {
    return (
      <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => {
        const parts = item.ref.split(".");
        return (
          <li key={item.ref} className="flex items-start justify-between gap-3 bg-card px-3 py-3">
            <div className="min-w-0">
              <Link
                href={`/read/${parts[0] ?? "GEN"}/${parts[1] ?? "1"}#v${parts[2]}`}
                className="focus-carbon text-sm font-semibold text-primary hover:underline"
              >
                {formatRef(item.ref)}
              </Link>
              {item.badge && (
                <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {item.badge}
                </span>
              )}
              {item.body && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{item.body}</p>
              )}
            </div>
            <button
              type="button"
              onClick={item.onRemove}
              aria-label={`Remove ${formatRef(item.ref)}`}
              className="focus-carbon shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
