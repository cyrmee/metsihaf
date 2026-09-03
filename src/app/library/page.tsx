import type { Metadata } from "next";
import { LibraryClient } from "@/components/library-client";

export const metadata: Metadata = {
  title: "My Library — Metsihaf",
  description: "Your bookmarks, highlights and notes, stored privately on this device only.",
  openGraph: {
    title: "My Library — Metsihaf",
    description: "Bookmarks, highlights and personal notes saved on your device.",
  },
};

export default function Page() {
  return <LibraryClient />;
}
