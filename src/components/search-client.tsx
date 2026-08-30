"use client";

import { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { formatRef } from "@/data/books";
import { API_BASE } from "@/lib/api-base";

async function searchAmharic(query: string): Promise<{ ref: string; text: string }[]> {
  const params = new URLSearchParams({ translation: "AMH", query });
  const res = await fetch(`${API_BASE}/api/search?${params.toString()}`);
  if (!res.ok) return [];
  const body = (await res.json()) as { results?: { ref: string; text: string }[] };
  return body.results ?? [];
}

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ ref: string; text: string }[] | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setBusy(true);
    try {
      setHits(await searchAmharic(q));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full-text search across the Amharic 1954 Bible.
        </p>
      </div>

      <form onSubmit={run} className="mt-5 flex gap-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ኢየሱስ, ፍቅር, ጸጋ…"
          aria-label="Search the Bible"
          className="focus-carbon font-ethiopic w-full border border-input bg-background px-3 py-2.5 text-base text-foreground"
        />
        <button
          type="submit"
          className="focus-carbon flex items-center gap-1.5 bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <SearchIcon className="h-4 w-4" /> Search
        </button>
      </form>

      {busy && <p className="mt-8 text-center text-sm text-muted-foreground">Searching…</p>}

      {!busy && hits && (
        <div className="mt-8">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {hits.length} result{hits.length === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-1.5">
            {hits.map((hit) => {
              const parts = hit.ref.split(".");
              return (
                <li key={hit.ref}>
                  <Link
                    href={`/read/${parts[0] ?? "GEN"}/${parts[1] ?? "1"}#v${parts[2]}`}
                    className="focus-carbon block bg-card px-3 py-3 hover:bg-accent"
                  >
                    <span className="text-xs font-semibold text-primary">
                      {formatRef(hit.ref, "am")}
                    </span>
                    <p className="font-ethiopic mt-1 text-[0.95rem] leading-relaxed text-foreground">
                      {hit.text}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
          {hits.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No verses matched that search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
