#!/usr/bin/env node
/**
 * Populates Verse.poetic (whether a verse renders one verse per line —
 * poetry — instead of folded into a flowing paragraph — prose) from BSB's
 * own USFM source (github.com/usfm-bible/examples.bsb, public domain),
 * by reading each verse's paragraph marker: `\q1`/`\q2`/`\q3`/`\qm*` (poetry)
 * vs. `\p`/`\m`/`\pi*`/`\li*` (prose).
 *
 * Requires the `poetic` column to already exist (run `npx prisma db push`
 * first if you haven't).
 *
 * Run: node scripts/seed-poetic-flags.mjs
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: new URL("../.env.local", import.meta.url).pathname });

const SOURCE_REPO = "usfm-bible/examples.bsb";
const RAW_BASE = `https://raw.githubusercontent.com/${SOURCE_REPO}/master`;
const VERSION = "BSB";

// USFM book number + code, in canonical Protestant-canon order. NT numbering skips 40.
const BOOKS = [
  [1, "GEN"], [2, "EXO"], [3, "LEV"], [4, "NUM"], [5, "DEU"], [6, "JOS"], [7, "JDG"],
  [8, "RUT"], [9, "1SA"], [10, "2SA"], [11, "1KI"], [12, "2KI"], [13, "1CH"], [14, "2CH"],
  [15, "EZR"], [16, "NEH"], [17, "EST"], [18, "JOB"], [19, "PSA"], [20, "PRO"], [21, "ECC"],
  [22, "SNG"], [23, "ISA"], [24, "JER"], [25, "LAM"], [26, "EZK"], [27, "DAN"], [28, "HOS"],
  [29, "JOL"], [30, "AMO"], [31, "OBA"], [32, "JON"], [33, "MIC"], [34, "NAM"], [35, "HAB"],
  [36, "ZEP"], [37, "HAG"], [38, "ZEC"], [39, "MAL"],
  [41, "MAT"], [42, "MRK"], [43, "LUK"], [44, "JHN"], [45, "ACT"], [46, "ROM"], [47, "1CO"],
  [48, "2CO"], [49, "GAL"], [50, "EPH"], [51, "PHP"], [52, "COL"], [53, "1TH"], [54, "2TH"],
  [55, "1TI"], [56, "2TI"], [57, "TIT"], [58, "PHM"], [59, "HEB"], [60, "JAS"], [61, "1PE"],
  [62, "2PE"], [63, "1JN"], [64, "2JN"], [65, "3JN"], [66, "JUD"], [67, "REV"],
];

const POETIC_MARKERS = new Set(["q", "q1", "q2", "q3", "q4", "qm", "qm1", "qm2", "qm3", "qr", "qc"]);
const PROSE_MARKERS = new Set(["p", "m", "pi", "pi1", "pi2", "pi3", "pc", "nb", "cls", "li", "li1", "li2", "li3"]);
// `\b` (stanza break / blank line) intentionally doesn't change style.

function parseUsfm(text) {
  let style = "prose";
  let chapter = 0;
  const verses = []; // [chapter, verse, style]
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const m = /^\\([A-Za-z0-9]+)/.exec(line);
    if (!m) continue;
    const tag = m[1];
    if (tag === "c") {
      chapter = parseInt(line.split(/\s+/)[1], 10);
      continue;
    }
    if (tag === "v") {
      const vm = /^\\v\s+(\d+)/.exec(line);
      if (vm) verses.push([chapter, parseInt(vm[1], 10), style]);
      continue;
    }
    if (tag === "b") continue;
    if (POETIC_MARKERS.has(tag)) style = "poetic";
    else if (PROSE_MARKERS.has(tag)) style = "prose";
    // headings (\s*), refs (\r), titles (\d), section markers (\ms,\mr,\sp), etc: ignore.
  }
  return verses;
}

function toRanges(verses) {
  const ranges = [];
  let cur = null;
  for (const [chapter, verse, style] of verses) {
    if (style !== "poetic") {
      cur = null;
      continue;
    }
    if (cur && cur.chapter === chapter && verse === cur.verseEnd + 1) {
      cur.verseEnd = verse;
    } else {
      cur = { chapter, verseStart: verse, verseEnd: verse };
      ranges.push(cur);
    }
  }
  return ranges;
}

async function fetchUsfm(num, code) {
  const padded = String(num).padStart(2, "0");
  const url = `${RAW_BASE}/${padded}${code}BSB.usfm`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set (expected in .env.local)");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");
    // Start from a clean slate so a rerun after BSB source changes is idempotent.
    const reset = await client.query('UPDATE "Verse" SET poetic = false WHERE version = $1', [VERSION]);
    console.log(`Reset ${reset.rowCount} rows to poetic = false`);

    let totalUpdated = 0;
    for (const [num, code] of BOOKS) {
      const usfm = await fetchUsfm(num, code);
      const verses = parseUsfm(usfm);
      const ranges = toRanges(verses);
      let bookUpdated = 0;
      for (const r of ranges) {
        const res = await client.query(
          'UPDATE "Verse" SET poetic = true WHERE version = $1 AND book = $2 AND chapter = $3 AND verse >= $4 AND verse <= $5',
          [VERSION, code, r.chapter, r.verseStart, r.verseEnd],
        );
        bookUpdated += res.rowCount ?? 0;
      }
      totalUpdated += bookUpdated;
      console.log(`${code}: ${ranges.length} ranges, ${bookUpdated} verses set poetic`);
    }
    await client.query("COMMIT");
    console.log(`\nDone. ${totalUpdated} verses set poetic = true across ${BOOKS.length} books.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
