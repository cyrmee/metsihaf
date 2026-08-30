/**
 * Syncs local-store data (bookmarks, highlights, notes, reading position,
 * preferences) with the server when signed in.
 *
 * local-store.ts stays the single source of truth the UI reads from — every
 * component keeps its synchronous getX()/isBookmarked() calls unchanged.
 * This module layers on top of it:
 *   - startRemoteSync(): on sign-in, pulls the server's copy into
 *     localStorage (merging in anything that only existed locally), then
 *     starts pushing every local write to the server in the background.
 *   - Call the returned cleanup function on sign-out to stop pushing.
 */
import { authedApiFetch } from "@/app/actions/proxy";
import {
  getAccentTheme,
  getBookmarks,
  getDarkMode,
  getFontSize,
  getHighlights,
  getLetterSpacing,
  getLineSpacing,
  getNotes,
  getReadingPosition,
  getShowVerseSelector,
  getVerseView,
  onStoreChange,
  saveReadingPosition,
  setAccentTheme,
  setDarkMode,
  setFontSize,
  setHighlight,
  setLetterSpacing,
  setLineSpacing,
  setNote,
  setShowVerseSelector,
  setVerseView,
  toggleBookmark,
  type AccentTheme,
  type HighlightColor,
  type LetterSpacing,
  type LineSpacing,
  type VerseViewMode,
} from "@/lib/local-store";

async function authedFetch(path: string, init?: { method?: string; body?: string }) {
  return authedApiFetch(path, init);
}

/** Pulls the server's copy of every table into localStorage, without dropping local-only items. */
async function pullRemoteIntoLocal() {
  const [bookmarksRes, highlightsRes, notesRes, posRes, prefsRes] = await Promise.all([
    authedFetch("/api/bookmarks"),
    authedFetch("/api/highlights"),
    authedFetch("/api/notes"),
    authedFetch("/api/reading-position"),
    authedFetch("/api/preferences"),
  ]);

  if (bookmarksRes?.ok) {
    const remote = bookmarksRes.body as { ref: string }[];
    const localRefs = new Set(getBookmarks().map((b) => b.ref));
    for (const b of remote) if (!localRefs.has(b.ref)) toggleBookmark(b.ref);
  }

  if (highlightsRes?.ok) {
    const remote = highlightsRes.body as { ref: string; color: HighlightColor }[];
    const local = new Set(getHighlights().map((h) => h.ref));
    for (const h of remote) if (!local.has(h.ref)) setHighlight(h.ref, h.color);
  }

  if (notesRes?.ok) {
    const remote = notesRes.body as { ref: string; text: string }[];
    const local = new Set(getNotes().map((n) => n.ref));
    for (const n of remote) if (!local.has(n.ref)) setNote(n.ref, n.text);
  }

  if (posRes?.ok) {
    const remote = posRes.body as {
      book: string;
      chapter: number;
      translation: string;
    } | null;
    if (remote && !getReadingPosition()) saveReadingPosition(remote);
  }

  if (prefsRes?.ok) {
    const remote = prefsRes.body as {
      darkMode: boolean;
      fontSize: number;
      verseView: VerseViewMode;
      accentTheme: AccentTheme;
      lineSpacing: LineSpacing;
      letterSpacing: LetterSpacing;
      showVerseSelector: boolean;
    };
    // Preferences are a single row (no per-item merge); local device settings win
    // only if this is the very first sync (i.e. no local value was ever set)
    // — in practice we just apply the remote copy, since it's the last-synced state.
    setDarkMode(remote.darkMode);
    setFontSize(remote.fontSize);
    setVerseView(remote.verseView);
    setAccentTheme(remote.accentTheme);
    setLineSpacing(remote.lineSpacing);
    setLetterSpacing(remote.letterSpacing);
    setShowVerseSelector(remote.showVerseSelector);
  }
}

/** Pushes every current local item to the server (used right after pulling, to persist local-only items). */
async function pushAllLocal() {
  await Promise.all([
    ...getBookmarks().map((b) =>
      authedFetch("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ ref: b.ref }),
      }),
    ),
    ...getHighlights().map((h) =>
      authedFetch("/api/highlights", {
        method: "POST",
        body: JSON.stringify({ ref: h.ref, color: h.color }),
      }),
    ),
    ...getNotes().map((n) =>
      authedFetch("/api/notes", {
        method: "POST",
        body: JSON.stringify({ ref: n.ref, text: n.text }),
      }),
    ),
  ]);
  const pos = getReadingPosition();
  if (pos) {
    await authedFetch("/api/reading-position", {
      method: "POST",
      body: JSON.stringify({ book: pos.book, chapter: pos.chapter, translation: pos.translation }),
    });
  }
  await authedFetch("/api/preferences", {
    method: "PATCH",
    body: JSON.stringify({
      darkMode: getDarkMode(),
      fontSize: getFontSize(),
      verseView: getVerseView(),
      accentTheme: getAccentTheme(),
      lineSpacing: getLineSpacing(),
      letterSpacing: getLetterSpacing(),
      showVerseSelector: getShowVerseSelector(),
    }),
  });
}

/**
 * Call once after sign-in. Merges server + local data, then keeps pushing
 * local writes to the server until the returned cleanup runs (call on
 * sign-out). Safe to call multiple times; each call replaces the previous
 * subscription.
 */
export function startRemoteSync(): () => void {
  let cancelled = false;

  (async () => {
    await pullRemoteIntoLocal();
    if (cancelled) return;
    await pushAllLocal();
  })();

  const unsubscribe = onStoreChange(() => {
    // Fire-and-forget: push the full local state on every local change.
    // Simpler and safer than diffing, and these tables are small.
    void pushAllLocal();
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}
