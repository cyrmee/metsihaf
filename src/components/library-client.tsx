"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Check, NotebookPen, Highlighter, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRef } from "@/data/books";
import {
  getBookmarks,
  getHighlights,
  getNotes,
  parseHighlightRef,
  setHighlight,
  setNote,
  toggleBookmark,
} from "@/lib/local-store";
import { useStoreVersion } from "@/lib/use-store-version";
import { useSession } from "@/lib/use-session";

type Tab = "bookmarks" | "highlights" | "notes";

const TABS: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "highlights", label: "Highlights", icon: Highlighter },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

export function LibraryClient() {
  const [tab, setTab] = useState<Tab>("bookmarks");
  const { user } = useSession();
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
          {user
            ? "Synced to your account, and available on any device you sign into."
            : "Saved on this device. Sign in from Settings to sync it across devices."}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-6">
        <TabsList className="grid w-full grid-cols-3 sm:mx-auto sm:w-auto sm:flex">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="min-w-0 gap-1 px-2 sm:gap-1.5 sm:px-3"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.label}</span>
                <span className="hidden text-muted-foreground sm:inline">({counts[t.id]})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

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
            items={highlights.map((h) => {
              const { translation, ref } = parseHighlightRef(h.ref);
              return {
                ref: h.ref,
                displayRef: ref,
                badge: translation ? `${h.color} in ${translation}` : h.color,
                onRemove: () => setHighlight(h.ref, null),
              };
            })}
          />
        )}
        {tab === "notes" && (
          <EntryList
            empty="No notes yet. Tap a verse while reading to write one."
            items={notes.map((n) => ({
              ref: n.ref,
              body: n.text,
              onRemove: () => setNote(n.ref, ""),
              onSave: (text: string) => setNote(n.ref, text),
            }))}
          />
        )}
      </div>
    </div>
  );
}

interface EntryItem {
  ref: string;
  /** Plain "BOOK.CHAPTER.VERSE" ref to link/format from, when `ref` itself is a composite key (highlights). Defaults to `ref`. */
  displayRef?: string;
  body?: string;
  badge?: string;
  onRemove: () => void;
  /** Present only for notes: saves an edited body in place. */
  onSave?: (text: string) => void;
}

function EntryList({ items, empty }: { items: EntryItem[]; empty: string }) {
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  const startEdit = (item: EntryItem) => {
    setEditingRef(item.ref);
    setDraft(item.body ?? "");
  };

  const saveEdit = (item: EntryItem) => {
    item.onSave?.(draft);
    setEditingRef(null);
  };

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => {
        const displayRef = item.displayRef ?? item.ref;
        const parts = displayRef.split(".");
        const isEditing = editingRef === item.ref;
        return (
          <li
            key={item.ref}
            className="flex items-start justify-between gap-3 rounded-md bg-card px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/read/${parts[0] ?? "GEN"}/${parts[1] ?? "1"}#v${parts[2]}`}
                className="focus-carbon text-sm font-semibold text-primary hover:underline"
              >
                {formatRef(displayRef)}
              </Link>
              {item.badge && (
                <Badge variant="secondary" className="ml-2">
                  {item.badge}
                </Badge>
              )}
              {isEditing ? (
                <div className="mt-1.5 flex flex-col gap-1.5">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    autoFocus
                    className="focus-carbon w-full rounded-md border border-input bg-background p-2 text-sm text-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(item)}
                      className="focus-carbon flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Check className="h-3 w-3" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRef(null)}
                      className="focus-carbon flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                item.body && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{item.body}</p>
                )
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.onSave && !isEditing && (
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  aria-label={`Edit note on ${formatRef(displayRef)}`}
                  className="focus-carbon text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={item.onRemove}
                aria-label={`Remove ${formatRef(displayRef)}`}
                className="focus-carbon text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
