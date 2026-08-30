import type { Metadata } from "next";
import { CompareChapterClient } from "@/components/compare-chapter-client";
import { BOOK_BY_ID } from "@/data/books";

type Params = Promise<{ book: string; chapter: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { book: bookId, chapter } = await params;
  const book = BOOK_BY_ID[bookId];
  const name = book ? book.nameEn : "Bible";
  const title = `Compare ${name} ${chapter} — Metsihaf`;
  const description = `Read ${name} ${chapter} in two translations side by side: Amharic 1954, NIV, ESV, NLT and NASB.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { book, chapter } = await params;
  return <CompareChapterClient book={book} chapter={chapter} />;
}
