import type { Metadata } from "next";
import { SearchClient } from "@/components/search-client";

export const metadata: Metadata = {
  title: "Search the Bible — Metsihaf",
  description:
    "Search the full Amharic 1954 Bible text by word or phrase and jump straight to any verse.",
  openGraph: {
    title: "Search the Bible — Metsihaf",
    description: "Full-text search across the Amharic 1954 Bible with instant verse links.",
  },
};

export default function Page() {
  return <SearchClient />;
}
