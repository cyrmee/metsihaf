import type { Metadata } from "next";
import { HomeRedirect } from "@/components/home-redirect";

export const metadata: Metadata = {
  title: "Metsihaf — Read the Bible in Amharic, NIV, ESV, NLT & NASB",
  description:
    "A personal Bible reader with the Amharic 1954 text, NIV, ESV, NLT and NASB, full cross-references, parallel reading, search, highlights and notes.",
  openGraph: {
    title: "Metsihaf — Personal Bible Reader",
    description:
      "Read and compare the Amharic 1954 Bible alongside NIV, ESV, NLT and NASB with cross-references and personal study tools.",
  },
};

export default function Page() {
  return <HomeRedirect />;
}
