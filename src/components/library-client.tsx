"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  Highlighter,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
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
  // Local study data lives in localStorage, unavailable during the server
  // render — reading it before mount would make the client's first paint
  // (with real counts) mismatch the server's (always empty), triggering a
  // hydration error. Rendering empty until mount keeps the two in sync;
  // the real data then appears on the client-only first effect pass.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bookmarks = mounted ? getBookmarks() : [];
  const highlights = mounted ? getHighlights() : [];
  const notes = mounted ? getNotes() : [];

  const counts: Record<Tab, number> = {
    bookmarks: bookmarks.length,
    highlights: highlights.length,
    notes: notes.length,
  };

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 sm:px-4">
      <div className="text-center">
        <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-signal uppercase">
          Library / 03
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          My Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user
            ? "Synced to your account, and available on any device you sign into."
            : "Saved on this device. Sign in from Settings to sync it across devices."}
        </p>
      </div>

      <div className="mt-6 border border-ink bg-paper shadow-[10px_10px_0_rgba(23,32,29,0.11)]">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="grid h-auto w-full grid-cols-3 border-b-0 sm:flex">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="min-w-0 gap-1 border-r border-rule px-2 py-3 last:border-r-0 sm:flex-1 sm:gap-1.5 sm:px-3"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                  <span className="text-muted">/ {String(counts[t.id]).padStart(2, "0")}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="border-t border-ink px-4 py-3 sm:px-6">
          {tab === "bookmarks" && (
            <EntryList
              key="bookmarks"
              label="Bookmarks"
              empty="No bookmarks yet."
              emptyHint="Tap a verse while reading to bookmark it"
              items={bookmarks.map((b) => ({
                ref: b.ref,
                onRemove: () => toggleBookmark(b.ref),
              }))}
            />
          )}
          {tab === "highlights" && (
            <EntryList
              key="highlights"
              label="Highlights"
              empty="No highlights yet."
              emptyHint="Tap a verse and pick a color"
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
              key="notes"
              label="Notes"
              empty="No notes yet."
              emptyHint="Tap a verse while reading to write one"
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

const PAGE_SIZE = 10;

function EntryList({
  items,
  label,
  empty,
  emptyHint,
}: {
  items: EntryItem[];
  label: string;
  empty: string;
  emptyHint: string;
}) {
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="font-display text-lg text-foreground">{empty}</p>
        <p className="font-mono text-[10px] tracking-[0.06em] text-muted uppercase">{emptyHint}</p>
      </div>
    );
  }

  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = items.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const startEdit = (item: EntryItem) => {
    setEditingRef(item.ref);
    setDraft(item.body ?? "");
  };

  const saveEdit = (item: EntryItem) => {
    item.onSave?.(draft);
    setEditingRef(null);
  };

  return (
    <div className="-mx-4 sm:-mx-6">
      <div className="mb-3 flex items-center gap-3 px-4 sm:px-6">
        <span className="font-mono text-[10px] tracking-[0.1em] text-signal uppercase">
          {label} / {String(items.length).padStart(2, "0")}
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-rule" />
      </div>
      <ul className="flex flex-col border-t border-rule">
        {pageItems.map((item, i) => {
          const displayRef = item.displayRef ?? item.ref;
          const parts = displayRef.split(".");
          const isEditing = editingRef === item.ref;
          return (
            <li
              key={item.ref}
              className={`flex items-start justify-between gap-3 bg-paper-white px-4 py-3 sm:px-6 ${i > 0 ? "border-t border-rule" : ""}`}
            >
              <span className="mt-0.5 font-mono text-[10px] text-muted">
                {String(currentPage * PAGE_SIZE + i + 1).padStart(2, "0")}
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
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            aria-label="Previous page"
            className="focus-editorial flex h-8 w-8 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
            Page {currentPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage === pageCount - 1}
            aria-label="Next page"
            className="focus-editorial flex h-8 w-8 items-center justify-center border border-ink text-ink hover:bg-ink hover:text-paper-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
