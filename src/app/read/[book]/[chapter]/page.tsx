import type { Metadata } from "next";
import { ReadChapterClient } from "@/components/read-chapter-client";
import { BOOK_BY_ID } from "@/data/books";

type Params = Promise<{ book: string; chapter: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { book: bookId, chapter } = await params;
  const book = BOOK_BY_ID[bookId];
  const name = book ? book.nameEn : "Bible";
  const title = `${name} ${chapter} — Metsihaf Bible Reader`;
  const description = `Read ${name} chapter ${chapter} in Amharic 1954, NIV, ESV, NLT or NASB with cross-references, highlights and notes.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { book, chapter } = await params;
  return <ReadChapterClient book={book} chapter={chapter} />;
}
