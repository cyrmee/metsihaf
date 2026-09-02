"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";
import { formatRef } from "@/data/books";
import { LANGUAGE_FONT_CLASS, type TranslationId } from "@/lib/bible";
import {
  addRecentSearch,
  getPreferredTranslation,
  getRecentSearches,
  removeRecentSearch,
  type RecentSearch,
} from "@/lib/local-store";
import { useTranslations } from "@/lib/use-translations";
import { TranslationSwitcher } from "@/components/translation-switcher";

interface Hit {
  ref: string;
  text: string;
}

const DEBOUNCE_MS = 400;

async function searchTranslation(translation: TranslationId, query: string): Promise<Hit[]> {
  const params = new URLSearchParams({ translation, query });
  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) return [];
  const body = (await res.json()) as { results?: Hit[] };
  return body.results ?? [];
}

/** Previous/next verse in the same chapter, for a one-line reading of context around a hit. */
async function getVerseContext(
  translation: TranslationId,
  refs: string[],
): Promise<Record<string, string | null>> {
  if (refs.length === 0) return {};
  const params = new URLSearchParams({ translation, refs: refs.join(",") });
  const res = await fetch(`/api/verse-text?${params.toString()}`);
  if (!res.ok) return {};
  const body = (await res.json()) as { texts?: Record<string, string | null> };
  return body.texts ?? {};
}

function neighborRefs(ref: string): { prevRef: string | null; nextRef: string } {
  const [book, chapter, verse] = ref.split(".");
  const v = Number(verse);
  return {
    prevRef: v > 1 ? `${book}.${chapter}.${v - 1}` : null,
    nextRef: `${book}.${chapter}.${v + 1}`,
  };
}

export function SearchClient() {
  const [translation, setTranslation] = useState<TranslationId>("HSAB");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<Record<string, string | null>>({});
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const { byId } = useTranslations();

  useEffect(() => {
    setTranslation(getPreferredTranslation() as TranslationId);
    setRecent(getRecentSearches());
  }, []);

  const language = byId[translation]?.language ?? "en";
  const languageFontClass = LANGUAGE_FONT_CLASS[language] ?? "";

  const runSearch = async (q: string, t: TranslationId) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits(null);
      setContext({});
      return;
    }
    const requestId = ++requestIdRef.current;
    setBusy(true);
    try {
      const results = await searchTranslation(t, trimmed);
      if (requestId !== requestIdRef.current) return;
      setHits(results);
      addRecentSearch(trimmed, t);
      setRecent(getRecentSearches());

      if (results.length > 0) {
        const neighborList = results.map((h) => neighborRefs(h.ref));
        const wanted = Array.from(
          new Set(
            neighborList.flatMap((n) => [n.prevRef, n.nextRef].filter((r): r is string => !!r)),
          ),
        );
        const texts = await getVerseContext(t, wanted);
        if (requestId !== requestIdRef.current) return;
        setContext(texts);
      } else {
        setContext({});
      }
    } finally {
      if (requestId === requestIdRef.current) setBusy(false);
    }
  };

  // Live search as you type, debounced; submitting the form runs it immediately.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setHits(null);
      setContext({});
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query, translation);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, translation]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void runSearch(query, translation);
  };

  const runRecent = (r: RecentSearch) => {
    setTranslation(r.translation as TranslationId);
    setQuery(r.query);
    void runSearch(r.query, r.translation as TranslationId);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full-text search across {byId[translation]?.id ?? translation}.
        </p>
      </div>

      <div className="mt-4 flex justify-center">
        <TranslationSwitcher value={translation} onChange={setTranslation} size="sm" />
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === "am" ? "ኢየሱስ, ፍቅር, ጸጋ…" : "Jesus, love, grace…"}
          aria-label="Search the Bible"
          className={`focus-carbon w-full rounded-l-md border border-r-0 border-input bg-background px-4 py-2.5 text-base text-foreground ${languageFontClass}`}
        />
        <button
          type="submit"
          className="focus-carbon flex items-center gap-1.5 rounded-r-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <SearchIcon className="h-4 w-4" /> Search
        </button>
      </form>

      {!hits && recent.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
            Recent searches
          </p>
          <ul className="flex flex-wrap justify-center gap-1.5">
            {recent.map((r) => (
              <li
                key={`${r.translation}:${r.query}`}
                className="flex items-stretch overflow-hidden rounded-md border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => runRecent(r)}
                  className={`focus-carbon flex items-center gap-1.5 py-1.5 pr-1.5 pl-3.5 text-sm text-foreground hover:bg-accent ${LANGUAGE_FONT_CLASS[byId[r.translation]?.language ?? "en"] ?? ""}`}
                >
                  {r.query}
                  <span className="text-xs text-muted-foreground">
                    {byId[r.translation]?.id ?? r.translation}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeRecentSearch(r.query, r.translation);
                    setRecent(getRecentSearches());
                  }}
                  aria-label={`Remove "${r.query}" from recent searches`}
                  className="focus-carbon flex items-center border-l border-border px-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {busy && <p className="mt-8 text-center text-sm text-muted-foreground">Searching…</p>}

      {!busy && hits && (
        <div className="mt-8">
          <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
            {hits.length} result{hits.length === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-1.5">
            {hits.map((hit) => {
              const parts = hit.ref.split(".");
              const { prevRef, nextRef } = neighborRefs(hit.ref);
              const before = prevRef ? context[prevRef] : null;
              const after = context[nextRef];
              return (
                <li key={hit.ref}>
                  <Link
                    href={`/read/${parts[0] ?? "GEN"}/${parts[1] ?? "1"}#v${parts[2]}`}
                    className="focus-carbon block rounded-md bg-card px-4 py-3 hover:bg-accent"
                  >
                    <span className="text-xs font-semibold text-primary">
                      {formatRef(hit.ref, language)}
                    </span>
                    {before && (
                      <p
                        className={`mt-1 truncate text-xs text-muted-foreground/70 ${languageFontClass}`}
                      >
                        {before}
                      </p>
                    )}
                    <p
                      className={`mt-1 text-[0.95rem] leading-relaxed text-foreground ${languageFontClass}`}
                    >
                      {hit.text}
                    </p>
                    {after && (
                      <p
                        className={`mt-1 truncate text-xs text-muted-foreground/70 ${languageFontClass}`}
                      >
                        {after}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {hits.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No verses matched &ldquo;{query.trim()}&rdquo;. Try a shorter word, or check the
              spelling.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
