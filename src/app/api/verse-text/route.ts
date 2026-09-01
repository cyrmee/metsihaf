import { NextResponse } from "next/server";
import { parseVerseRef } from "@/data/books";
import { BIBLE_CACHE_CONTROL } from "@/lib/cache-control";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { getAvailableTranslations, getVerseTextRow } from "@/lib/db/verse-db";
import { asIn } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const available = await getAvailableTranslations();
    const translation = asIn(
      searchParams.get("translation"),
      available.map((t) => t.id),
      "translation",
    );
    const refsParam = searchParams.get("refs") ?? "";
    const refs = refsParam
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const texts: Record<string, string | null> = {};
    await Promise.all(
      refs.map(async (ref) => {
        const parsed = parseVerseRef(ref);
        texts[ref] = parsed
          ? await getVerseTextRow(translation, parsed.book, parsed.chapter, parsed.verse)
          : null;
      }),
    );
    return NextResponse.json({ texts }, { headers: { "Cache-Control": BIBLE_CACHE_CONTROL } });
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
