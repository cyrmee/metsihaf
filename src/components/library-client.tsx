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
    <div className="mx-auto max-w-3xl px-2 py-8 sm:px-4">
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
                <span className="hidden text-muted sm:inline">· {counts[t.id]}</span>
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
      <div className="flex items-center gap-4 border-t border-b border-rule py-6">
        <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">00</span>
        <p className="font-display text-base text-foreground">{empty}</p>
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
    <ul className="flex flex-col border border-ink">
      {items.map((item, i) => {
        const displayRef = item.displayRef ?? item.ref;
        const parts = displayRef.split(".");
        const isEditing = editingRef === item.ref;
        return (
          <li
            key={item.ref}
            className={`flex items-start justify-between gap-3 bg-paper-white px-3 py-3 ${i > 0 ? "border-t border-rule" : ""}`}
          >
            <span className="mt-0.5 font-mono text-[10px] text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/read/${parts[0] ?? "GEN"}/${parts[1] ?? "1"}#v${parts[2]}`}
                className="focus-editorial text-sm font-semibold text-signal hover:underline"
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
                    className="focus-editorial w-full border border-[#b8b4aa] bg-paper-white p-2 text-sm text-ink"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => saveEdit(item)}
                      className="focus-editorial flex items-center gap-1 bg-signal px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.06em] text-paper-white uppercase hover:bg-signal-hover"
                    >
                      <Check className="h-3 w-3" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRef(null)}
                      className="focus-editorial flex items-center gap-1 text-xs text-ink underline decoration-1 underline-offset-4 hover:text-signal"
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
            <div className="flex shrink-0 items-center gap-3 border-l border-rule pl-3">
              {item.onSave && !isEditing && (
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  aria-label={`Edit note on ${formatRef(displayRef)}`}
                  className="focus-editorial text-muted hover:text-ink"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={item.onRemove}
                aria-label={`Remove ${formatRef(displayRef)}`}
                className="focus-editorial text-muted hover:text-signal"
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
