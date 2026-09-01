#!/usr/bin/env node
/**
 * Builds src/data/amharic.db (SQLite) from the Haile Selassie Amharic Bible
 * text dump at scripts/sources/hsab-amharic.txt (same translation bible.org
 * hosts at /sites/bible.org/resources/foreign/amharic/, mirrored as plain
 * text by github.com/bible-hub/Bibles since bible.org itself sits behind a
 * Cloudflare challenge).
 *
 * That source also has ~5,900 verses with empty text and is missing Malachi 4
 * entirely — both are known gaps inherited from the original 1992-93
 * digitization of this translation (the same gaps show up independently in
 * wordproject.org's copy). Both are patched from
 * scripts/sources/amh-legacy-bundle.json, a snapshot of the app's previous
 * bundled data, which has them correct.
 *
 * This translation also combines some verses under one shared number (e.g.
 * bible.org shows Colossians 1 as "... 12, 13-14, 15-16, 17 ..." — verses 13
 * and 14 share one paragraph). This mirror represents that by writing a
 * combined group's full text once and leaving the other member(s) blank —
 * except in the many chapters where the site's line-based export lost the
 * paragraph breaks between verses, gluing a whole run of verses (combined or
 * not) into a single line with each subsequent verse's real number inlined
 * as plain text (e.g. one line's text ends "... 10-11 <verse 10-11 text> 12
 * <verse 12 text> 13-14 <verse 13-14 text> ..."). splitEmbeddedLabels() below
 * recovers the real verse boundaries and combined-range labels from that.
 *
 * Usage: npm run db:build (or: node backend/scripts/build-amharic-db.mjs)
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
// This script lives under backend/scripts (kept out of the Next.js app's
// type-check/lint/bundle graph); the runtime data it produces belongs in the
// app's own src/data, one level up from `root` (backend/).
const repoRoot = path.join(root, "..");

const SOURCE_PATH = path.join(root, "scripts/sources/hsab-amharic.txt");
const OLD_JSON_PATH = path.join(root, "scripts/sources/amh-legacy-bundle.json");
const DB_PATH = path.join(repoRoot, "src/data/amharic.db");

// English book name (as used by the source file) -> USFM id + expected chapter count,
// in canonical order. Kept in sync with src/data/books.ts.
const BOOKS = [
  ["Genesis", "GEN", 50],
  ["Exodus", "EXO", 40],
  ["Leviticus", "LEV", 27],
  ["Numbers", "NUM", 36],
  ["Deuteronomy", "DEU", 34],
  ["Joshua", "JOS", 24],
  ["Judges", "JDG", 21],
  ["Ruth", "RUT", 4],
  ["1 Samuel", "1SA", 31],
  ["2 Samuel", "2SA", 24],
  ["1 Kings", "1KI", 22],
  ["2 Kings", "2KI", 25],
  ["1 Chronicles", "1CH", 29],
  ["2 Chronicles", "2CH", 36],
  ["Ezra", "EZR", 10],
  ["Nehemiah", "NEH", 13],
  ["Esther", "EST", 10],
  ["Job", "JOB", 42],
  ["Psalm", "PSA", 150],
  ["Proverbs", "PRO", 31],
  ["Ecclesiastes", "ECC", 12],
  ["Song of Solomon", "SNG", 8],
  ["Isaiah", "ISA", 66],
  ["Jeremiah", "JER", 52],
  ["Lamentations", "LAM", 5],
  ["Ezekiel", "EZK", 48],
  ["Daniel", "DAN", 12],
  ["Hosea", "HOS", 14],
  ["Joel", "JOL", 3],
  ["Amos", "AMO", 9],
  ["Obadiah", "OBA", 1],
  ["Jonah", "JON", 4],
  ["Micah", "MIC", 7],
  ["Nahum", "NAM", 3],
  ["Habakkuk", "HAB", 3],
  ["Zephaniah", "ZEP", 3],
  ["Haggai", "HAG", 2],
  ["Zechariah", "ZEC", 14],
  ["Malachi", "MAL", 4],
  ["Matthew", "MAT", 28],
  ["Mark", "MRK", 16],
  ["Luke", "LUK", 24],
  ["John", "JHN", 21],
  ["Acts", "ACT", 28],
  ["Romans", "ROM", 16],
  ["1 Corinthians", "1CO", 16],
  ["2 Corinthians", "2CO", 13],
  ["Galatians", "GAL", 6],
  ["Ephesians", "EPH", 6],
  ["Philippians", "PHP", 4],
  ["Colossians", "COL", 4],
  ["1 Thessalonians", "1TH", 5],
  ["2 Thessalonians", "2TH", 3],
  ["1 Timothy", "1TI", 6],
  ["2 Timothy", "2TI", 4],
  ["Titus", "TIT", 3],
  ["Philemon", "PHM", 1],
  ["Hebrews", "HEB", 13],
  ["James", "JAS", 5],
  ["1 Peter", "1PE", 5],
  ["2 Peter", "2PE", 3],
  ["1 John", "1JN", 5],
  ["2 John", "2JN", 1],
  ["3 John", "3JN", 1],
  ["Jude", "JUD", 1],
  ["Revelation", "REV", 22],
];
const NAME_TO_ID = new Map(BOOKS.map(([name, id]) => [name, id]));

const oldAmh = JSON.parse(fs.readFileSync(OLD_JSON_PATH, "utf8"));
const oldTextFor = (id, chapter, verse) => {
  const bi = BOOKS.findIndex(([, bookId]) => bookId === id);
  return oldAmh[bi]?.[chapter - 1]?.[verse - 1]?.trim() || "";
};

// Splits a line's text on verse-number tokens ("12", "13-14", …) that the
// site's own line-based export left inlined as plain text after a run of
// verses got glued onto one line. Preceded by sentence-ending punctuation
// and followed by Ethiopic script, so it doesn't fire on ordinary numerals.
const LABEL_RE = /[።፤፥]\s*(\d{1,3}(?:-\d{1,3})?)[፤:]?\s+(?=[ሀ-፿])/g;
function splitEmbeddedLabels(text) {
  const segments = [];
  let lastIndex = 0;
  let lastLabel = null;
  let m;
  LABEL_RE.lastIndex = 0;
  while ((m = LABEL_RE.exec(text))) {
    const cutAt = m.index + 1; // keep the punctuation mark with the preceding segment
    segments.push({ label: lastLabel, text: text.slice(lastIndex, cutAt).trim() });
    lastLabel = m[1];
    lastIndex = m.index + m[0].length;
  }
  segments.push({ label: lastLabel, text: text.slice(lastIndex).trim() });
  return segments;
}

// Read the source into per-chapter row lists, in file order.
const rowsByChapter = new Map(); // "GEN.1" -> [{verse, text}]
const lines = fs
  .readFileSync(SOURCE_PATH, "utf8")
  .split("\n")
  .map((l) => l.replace(/\r$/, ""))
  .filter((l) => l.trim());
for (const line of lines) {
  const parts = line.split("||");
  if (parts.length < 4) throw new Error(`Malformed source line: ${JSON.stringify(line)}`);
  const [bookName, chStr, vsStr, ...rest] = parts;
  const id = NAME_TO_ID.get(bookName);
  if (!id) throw new Error(`Unknown book name in source: ${bookName}`);
  const chapter = Number(chStr);
  const verse = Number(vsStr);
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) {
    throw new Error(`Bad line for ${bookName}: ${JSON.stringify(line)}`);
  }
  const key = `${id}.${chapter}`;
  if (!rowsByChapter.has(key)) rowsByChapter.set(key, []);
  rowsByChapter.get(key).push({ verse, text: rest.join("||").trim() });
}

// book -> chapter -> verse (group start) -> { end, text }
const data = new Map();
function setGroup(book, chapter, start, end, text) {
  if (!data.has(book)) data.set(book, new Map());
  const chapters = data.get(book);
  if (!chapters.has(chapter)) chapters.set(chapter, new Map());
  chapters.get(chapter).set(start, { end, text });
}

let emptyInSource = 0;
let filledFromOld = 0;
let combinedGroups = 0;
let malformedLabels = 0;
let gapsFilled = 0;
const stillEmpty = [];

// The source has no row at all for some verse numbers (not even a blank
// line) — fill each with the legacy text, or leave it blank, rather than
// letting every later verse in the chapter silently shift down a number.
function fillGap(id, chapter, from, toExclusive) {
  for (let n = from; n < toExclusive; n++) {
    gapsFilled++;
    emptyInSource++;
    const fallback = oldTextFor(id, chapter, n);
    if (fallback) filledFromOld++;
    else stillEmpty.push(`${id} ${chapter}:${n}`);
    setGroup(id, chapter, n, n, fallback);
  }
}

for (const [key, rows] of rowsByChapter) {
  const [id, chStr] = key.split(".");
  const chapter = Number(chStr);
  let expected = 1;
  for (const { verse: v, text } of rows) {
    if (v < expected) continue; // stale echo already covered by an earlier line's recovered range
    fillGap(id, chapter, expected, v);
    if (!text) {
      emptyInSource++;
      const fallback = oldTextFor(id, chapter, v);
      if (fallback) filledFromOld++;
      else stillEmpty.push(`${id} ${chapter}:${v}`);
      setGroup(id, chapter, v, v, fallback);
      expected = v + 1;
      continue;
    }
    const segments = splitEmbeddedLabels(text);
    let ownText = segments[0].text;
    if (!ownText) {
      emptyInSource++;
      const fallback = oldTextFor(id, chapter, v);
      if (fallback) {
        ownText = fallback;
        filledFromOld++;
      } else {
        stillEmpty.push(`${id} ${chapter}:${v}`);
      }
    }
    setGroup(id, chapter, v, v, ownText);
    expected = v + 1;
    for (let i = 1; i < segments.length; i++) {
      const label = segments[i].label;
      const [s, e] = label.includes("-")
        ? label.split("-").map(Number)
        : [Number(label), Number(label)];
      if (!Number.isInteger(s) || !Number.isInteger(e) || e < s || s < expected) {
        // The label itself got garbled (e.g. "36" split into "3" + a stray
        // mark + "6", read here as out-of-order "6") — rare OCR-ish noise.
        // The text after it is still real, boundary-adjacent content, so
        // number it as whatever verse comes next rather than guessing at
        // the broken digits or gluing it onto the previous verse.
        malformedLabels++;
        setGroup(id, chapter, expected, expected, segments[i].text);
        expected += 1;
        continue;
      }
      fillGap(id, chapter, expected, s);
      if (e > s) combinedGroups++;
      let segText = segments[i].text;
      if (!segText) {
        emptyInSource++;
        const fallback = oldTextFor(id, chapter, s);
        if (fallback) {
          segText = fallback;
          filledFromOld++;
        } else {
          stillEmpty.push(`${id} ${chapter}:${s}${e > s ? `-${e}` : ""}`);
        }
      }
      setGroup(id, chapter, s, e, segText);
      expected = e + 1;
    }
  }
}
console.log(
  `Source had ${emptyInSource} empty verses; filled ${filledFromOld} from amh.json; ` +
    `${stillEmpty.length} remain empty in both sources (a known gap in this translation's digitization).`,
);
console.log(
  `Recovered ${combinedGroups} combined verse ranges (e.g. "13-14") glued into other lines by the site's export; ` +
    `recovered ${malformedLabels} verses whose inline number was garbled by OCR-ish noise; ` +
    `filled ${gapsFilled} verse numbers that had no row at all in the source.`,
);

// Drop duplicate tails: the site's export sometimes repeats a chapter's last
// few verses again under bogus extra numbers right after the real ending
// (e.g. Colossians 1 had a second, bogus 30-34 that's just 25-29 again). A
// run of 3+ verses whose text exactly matches the run immediately before it
// is that artifact, not real content — drop everything from there on.
let duplicateTailsDropped = 0;
for (const [, id] of BOOKS) {
  const chapters = data.get(id);
  for (const ch of chapters.keys()) {
    const groups = chapters.get(ch);
    const starts = [...groups.keys()].sort((a, b) => a - b);
    for (let tailLen = Math.floor(starts.length / 2); tailLen >= 3; tailLen--) {
      const tailAt = starts.length - tailLen;
      const prevAt = tailAt - tailLen;
      if (prevAt < 0) continue;
      const matches = Array.from({ length: tailLen }, (_, k) => {
        const a = groups.get(starts[prevAt + k]).text;
        const b = groups.get(starts[tailAt + k]).text;
        return a.length > 5 && a === b;
      }).every(Boolean);
      if (matches) {
        for (let k = tailAt; k < starts.length; k++) groups.delete(starts[k]);
        duplicateTailsDropped += tailLen;
        break;
      }
    }
  }
}
if (duplicateTailsDropped) {
  console.log(`Dropped ${duplicateTailsDropped} bogus duplicate trailing verses.`);
}

// Merge a blank verse into the verse immediately before it: bible.org never
// shows an empty paragraph, so wherever our data has a verse with no text at
// all, it's because that verse's content was folded into the neighboring
// paragraph on the real site (the same combined-verse convention as
// "13-14", just one this mirror didn't preserve a label for) — display it
// the same way, as a combined range, instead of a lone empty verse number.
let blanksMerged = 0;
for (const [, id] of BOOKS) {
  const chapters = data.get(id);
  for (const ch of chapters.keys()) {
    const groups = chapters.get(ch);
    const starts = [...groups.keys()].sort((a, b) => a - b);
    let i = 0;
    while (i < starts.length) {
      const s = starts[i];
      const g = groups.get(s);
      if (g.text || i === 0) {
        i++;
        continue;
      }
      const prevStart = starts[i - 1];
      const prev = groups.get(prevStart);
      if (prev.end + 1 === s && prev.text) {
        groups.set(prevStart, { end: g.end, text: prev.text });
        groups.delete(s);
        starts.splice(i, 1);
        blanksMerged++;
        continue;
      }
      i++;
    }
  }
}
if (blanksMerged) {
  console.log(`Merged ${blanksMerged} blank verses into the combined range they belong to.`);
}

// Merge adjacent groups that ended up with the exact same text: this happens
// when one member of a combined range came through as blank from the main
// source and got filled from amh.json, which independently has the shared
// text at a different member of that same range — same content, two spots.
let duplicateNeighborsMerged = 0;
for (const [, id] of BOOKS) {
  const chapters = data.get(id);
  for (const ch of chapters.keys()) {
    const groups = chapters.get(ch);
    const starts = [...groups.keys()].sort((a, b) => a - b);
    let i = 1;
    while (i < starts.length) {
      const prevStart = starts[i - 1];
      const s = starts[i];
      const prev = groups.get(prevStart);
      const g = groups.get(s);
      if (prev.end + 1 === s && prev.text && prev.text === g.text) {
        groups.set(prevStart, { end: g.end, text: prev.text });
        groups.delete(s);
        starts.splice(i, 1);
        duplicateNeighborsMerged++;
        continue;
      }
      i++;
    }
  }
}
if (duplicateNeighborsMerged) {
  console.log(
    `Merged ${duplicateNeighborsMerged} adjacent verses that ended up with identical text.`,
  );
}

// Patch the known gap: Malachi 4 is missing from the source entirely. Pull it
// from the previously bundled amh.json (index 37 = Malachi, chapter 4 = index 3).
if (!data.get("MAL")?.has(4)) {
  const malIdx = BOOKS.findIndex(([, id]) => id === "MAL");
  const malChapter4 = oldAmh[malIdx]?.[3];
  if (!malChapter4) throw new Error("Expected Malachi 4 in the old amh.json to patch with.");
  malChapter4.forEach((text, i) => setGroup("MAL", 4, i + 1, i + 1, text));
  console.log(`Patched Malachi 4 with ${malChapter4.length} verses from amh.json.`);
}

// Validate: every expected book/chapter present, groups contiguous from 1 with no overlaps.
let totalVerses = 0;
let totalGroups = 0;
for (const [, id, expectedChapters] of BOOKS) {
  const chapters = data.get(id);
  if (!chapters) throw new Error(`Missing book entirely: ${id}`);
  const chapterNums = [...chapters.keys()].sort((a, b) => a - b);
  const maxChapter = Math.max(...chapterNums);
  if (maxChapter !== expectedChapters || chapterNums.length !== expectedChapters) {
    throw new Error(
      `${id}: expected ${expectedChapters} chapters, found ${chapterNums.length} (max ${maxChapter})`,
    );
  }
  for (const ch of chapterNums) {
    const groups = chapters.get(ch);
    const starts = [...groups.keys()].sort((a, b) => a - b);
    let cursor = 1;
    for (const s of starts) {
      if (s !== cursor) {
        throw new Error(`${id} ${ch}: gap or overlap in verse groups at ${cursor} (found ${s})`);
      }
      cursor = groups.get(s).end + 1;
      totalVerses += groups.get(s).end - s + 1;
      totalGroups++;
    }
  }
}
console.log(
  `Validated 66 books, ${totalGroups} verse groups covering ${totalVerses} verses, zero gaps.`,
);

// Write the SQLite db.
fs.rmSync(DB_PATH, { force: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE verses (
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    label TEXT NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (book, chapter, verse)
  );
  CREATE VIRTUAL TABLE verses_fts USING fts5(text, content='verses', content_rowid='rowid');
`);

const insertVerse = db.prepare(
  "INSERT INTO verses (book, chapter, verse, verse_end, label, text) VALUES (?, ?, ?, ?, ?, ?)",
);
const insertFts = db.prepare("INSERT INTO verses_fts (rowid, text) VALUES (?, ?)");

db.exec("BEGIN");
for (const [, id] of BOOKS) {
  const chapters = data.get(id);
  for (const ch of [...chapters.keys()].sort((a, b) => a - b)) {
    const groups = chapters.get(ch);
    for (const start of [...groups.keys()].sort((a, b) => a - b)) {
      const { end, text } = groups.get(start);
      const label = end > start ? `${start}-${end}` : `${start}`;
      const result = insertVerse.run(id, ch, start, end, label, text);
      insertFts.run(Number(result.lastInsertRowid), text);
    }
  }
}
db.exec("COMMIT");
db.close();

console.log(`Wrote ${DB_PATH}`);
