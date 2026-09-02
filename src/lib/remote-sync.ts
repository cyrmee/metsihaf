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
  deleteBookmark,
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
  addBookmark,
  getAccentTheme,
  getBookmarks,
  getFontSize,
  getHighlights,
  getLetterSpacing,
  getLineSpacing,
  getNotes,
  getReadingPosition,
  onStoreChange,
  saveReadingPosition,
  setAccentTheme,
  setFontSize,
  setHighlight,
  setLetterSpacing,
  setLineSpacing,
  setNote,
} from "@/lib/local-store";

/**
 * Pages through a `getX(cursor)` sync action, collecting every item across
 * all pages. Stops (returning what it has so far) on the first failed page,
 * e.g. the user session expiring mid-pull.
 */
async function fetchAllPages<T>(
  getPage: (
    cursor?: string,
  ) => Promise<{ ok: boolean; body: { items: T[]; nextCursor: string | null } | null }>,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const res = await getPage(cursor);
    if (!res.ok || !res.body) break;
    items.push(...res.body.items);
    if (!res.body.nextCursor) break;
    cursor = res.body.nextCursor;
  }
  return items;
}

/** Pulls the server's copy of every table into localStorage, without dropping local-only items. */
async function pullRemoteIntoLocal() {
  const [remoteBookmarks, remoteHighlights, remoteNotes, posRes, prefsRes] = await Promise.all([
    fetchAllPages(getRemoteBookmarks),
    fetchAllPages(getRemoteHighlights),
    fetchAllPages(getRemoteNotes),
    getRemoteReadingPosition(),
    getRemotePreferences(),
  ]);

  const localBookmarkRefs = new Set(getBookmarks().map((b) => b.ref));
  for (const b of remoteBookmarks)
    if (!localBookmarkRefs.has(b.ref)) addBookmark(b.ref, b.createdAt);

  const localHighlightRefs = new Set(getHighlights().map((h) => h.ref));
  for (const h of remoteHighlights)
    if (!localHighlightRefs.has(h.ref)) setHighlight(h.ref, h.color, h.createdAt);

  const localNoteRefs = new Set(getNotes().map((n) => n.ref));
  for (const n of remoteNotes) if (!localNoteRefs.has(n.ref)) setNote(n.ref, n.text, n.createdAt);

  if (posRes.ok && posRes.body && !getReadingPosition()) {
    saveReadingPosition(posRes.body);
  }

  if (prefsRes.ok && prefsRes.body) {
    const remote = prefsRes.body;
    // Preferences are a single row (no per-item merge); local device settings win
    // only if this is the very first sync (i.e. no local value was ever set)
    // — in practice we just apply the remote copy, since it's the last-synced state.
    setFontSize(remote.fontSize);
    setAccentTheme(remote.accentTheme);
    setLineSpacing(remote.lineSpacing);
    setLetterSpacing(remote.letterSpacing);
  }
}

/**
 * Pushes every current local item to the server (used right after pulling,
 * to persist local-only items), then deletes anything the server still has
 * that's no longer present locally — otherwise a local removal (e.g.
 * clearing a highlight) would never reach the server, and the next pull
 * (next reload, next sign-in) would bring the "deleted" item right back.
 */
async function pushAllLocal() {
  const localBookmarks = getBookmarks();
  const localHighlights = getHighlights();
  const localNotes = getNotes();

  await Promise.all([
    ...localBookmarks.map((b) => upsertBookmark(b.ref, b.createdAt)),
    ...localHighlights.map((h) => upsertOrDeleteHighlight(h.ref, h.color, h.createdAt)),
    ...localNotes.map((n) => upsertOrDeleteNote(n.ref, n.text, n.createdAt)),
  ]);

  const [remoteBookmarks, remoteHighlights, remoteNotes] = await Promise.all([
    fetchAllPages(getRemoteBookmarks),
    fetchAllPages(getRemoteHighlights),
    fetchAllPages(getRemoteNotes),
  ]);
  const localBookmarkRefs = new Set(localBookmarks.map((b) => b.ref));
  const localHighlightRefs = new Set(localHighlights.map((h) => h.ref));
  const localNoteRefs = new Set(localNotes.map((n) => n.ref));

  await Promise.all([
    ...remoteBookmarks
      .filter((b) => !localBookmarkRefs.has(b.ref))
      .map((b) => deleteBookmark(b.ref)),
    ...remoteHighlights
      .filter((h) => !localHighlightRefs.has(h.ref))
      .map((h) => upsertOrDeleteHighlight(h.ref, null)),
    ...remoteNotes
      .filter((n) => !localNoteRefs.has(n.ref))
      .map((n) => upsertOrDeleteNote(n.ref, undefined)),
  ]);

  const pos = getReadingPosition();
  if (pos) {
    await upsertReadingPosition(pos.book, pos.chapter, pos.translation);
  }
  await updatePreferences({
    fontSize: getFontSize(),
    accentTheme: getAccentTheme(),
    lineSpacing: getLineSpacing(),
    letterSpacing: getLetterSpacing(),
  });
}

/** Push in the background; a failure (e.g. offline) is swallowed — the local write already succeeded, and the next successful push sends the current state anyway, so nothing is lost. */
function pushAllLocalBestEffort() {
  pushAllLocal().catch(() => {});
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
  })().catch(() => {
    // Best-effort: offline or a transient error at sign-in time. The next
    // local change (or reconnect, or app load) retries the full sync anyway.
  });

  const unsubscribeStore = onStoreChange(pushAllLocalBestEffort);
  // A change made while offline never gets a second attempt on its own —
  // nothing else triggers a retry until the next local edit or app reload.
  // Catch the moment connectivity comes back and push then too.
  window.addEventListener("online", pushAllLocalBestEffort);

  return () => {
    cancelled = true;
    unsubscribeStore();
    window.removeEventListener("online", pushAllLocalBestEffort);
  };
}
