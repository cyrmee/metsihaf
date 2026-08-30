"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getReadingPosition } from "@/lib/local-store";

/** No landing page — send the reader straight into the Bible: back to where they left off, or Genesis 1. */
export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const position = getReadingPosition();
    router.replace(position ? `/read/${position.book}/${position.chapter}` : "/read/GEN/1");
  }, [router]);

  return null;
}
