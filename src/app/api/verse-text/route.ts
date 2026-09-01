import { NextResponse } from "next/server";
import { parseVerseRef } from "@/data/books";
import { getVerseTextRow } from "@/lib/db/amharic-db";
import { toApiError } from "@/lib/db/handle-prisma-error";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refsParam = searchParams.get("refs") ?? "";
    const refs = refsParam
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const texts: Record<string, string | null> = {};
    for (const ref of refs) {
      const parsed = parseVerseRef(ref);
      texts[ref] = parsed ? getVerseTextRow(parsed.book, parsed.chapter, parsed.verse) : null;
    }
    return NextResponse.json({ texts });
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
