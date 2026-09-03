import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BOOK_BY_ID } from "@/data/books";

export const metadata: Metadata = {
  title: "Metsihaf — Read the Bible in Amharic, NIV, ESV, NLT & NASB",
  description:
    "A personal Bible reader with the Amharic 1954 text, NIV, ESV, NLT and NASB, full cross-references, search, highlights and notes.",
  openGraph: {
    title: "Metsihaf — Personal Bible Reader",
    description:
      "Read the Amharic 1954 Bible alongside NIV, ESV, NLT and NASB with cross-references and personal study tools.",
  },
};

/**
 * No landing page — send the reader straight into the Bible: back to where
 * they left off, or Genesis 1. Reading position is read from a cookie (see
 * `saveReadingPosition` in local-store.ts) so this redirect happens on the
 * server, in the initial response — no blank client-rendered page waiting on
 * a `useEffect` + localStorage read before navigating.
 */
export default async function Page() {
  const store = await cookies();
  const raw = store.get("bible.position")?.value;
  // `redirect()` throws internally to unwind rendering, so it must never sit
  // inside this try — otherwise the catch below would swallow that throw.
  let pos: { book?: string; chapter?: number } | null = null;
  if (raw) {
    try {
      pos = JSON.parse(decodeURIComponent(raw)) as { book?: string; chapter?: number };
    } catch {
      pos = null;
    }
  }
  if (pos?.book && BOOK_BY_ID[pos.book] && Number.isInteger(pos.chapter) && pos.chapter! >= 1) {
    redirect(`/read/${pos.book}/${pos.chapter}`);
  }
  redirect("/read/GEN/1");
}
