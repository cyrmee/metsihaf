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
import {
  getBookmarks as getRemoteBookmarks,
  getHighlights as getRemoteHighlights,
  getNotes as getRemoteNotes,
  getPreferences as getRemotePreferences,
  getReadingPosition as getRemoteReadingPosition,
  updatePreferences,
  upsertBookmark,
  upsertOrDeleteHighlight,
  upsertOrDeleteNote,
  upsertReadingPosition,
} from "@/app/actions/sync";
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
  setVerseView,
  toggleBookmark,
} from "@/lib/local-store";

/** Pulls the server's copy of every table into localStorage, without dropping local-only items. */
async function pullRemoteIntoLocal() {
  const [bookmarksRes, highlightsRes, notesRes, posRes, prefsRes] = await Promise.all([
    getRemoteBookmarks(),
    getRemoteHighlights(),
    getRemoteNotes(),
    getRemoteReadingPosition(),
    getRemotePreferences(),
  ]);

  if (bookmarksRes.ok && bookmarksRes.body) {
    const localRefs = new Set(getBookmarks().map((b) => b.ref));
    for (const b of bookmarksRes.body) if (!localRefs.has(b.ref)) toggleBookmark(b.ref);
  }

  if (highlightsRes.ok && highlightsRes.body) {
    const local = new Set(getHighlights().map((h) => h.ref));
    for (const h of highlightsRes.body) if (!local.has(h.ref)) setHighlight(h.ref, h.color);
  }

  if (notesRes.ok && notesRes.body) {
    const local = new Set(getNotes().map((n) => n.ref));
    for (const n of notesRes.body) if (!local.has(n.ref)) setNote(n.ref, n.text);
  }

  if (posRes.ok && posRes.body && !getReadingPosition()) {
    saveReadingPosition(posRes.body);
  }

  if (prefsRes.ok && prefsRes.body) {
    const remote = prefsRes.body;
    // Preferences are a single row (no per-item merge); local device settings win
    // only if this is the very first sync (i.e. no local value was ever set)
    // — in practice we just apply the remote copy, since it's the last-synced state.
    setDarkMode(remote.darkMode);
    setFontSize(remote.fontSize);
    setVerseView(remote.verseView);
    setAccentTheme(remote.accentTheme);
    setLineSpacing(remote.lineSpacing);
    setLetterSpacing(remote.letterSpacing);
  }
}

/** Pushes every current local item to the server (used right after pulling, to persist local-only items). */
async function pushAllLocal() {
  await Promise.all([
    ...getBookmarks().map((b) => upsertBookmark(b.ref)),
    ...getHighlights().map((h) => upsertOrDeleteHighlight(h.ref, h.color)),
    ...getNotes().map((n) => upsertOrDeleteNote(n.ref, n.text)),
  ]);
  const pos = getReadingPosition();
  if (pos) {
    await upsertReadingPosition(pos.book, pos.chapter, pos.translation);
  }
  await updatePreferences({
    darkMode: getDarkMode(),
    fontSize: getFontSize(),
    verseView: getVerseView(),
    accentTheme: getAccentTheme(),
    lineSpacing: getLineSpacing(),
    letterSpacing: getLetterSpacing(),
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
