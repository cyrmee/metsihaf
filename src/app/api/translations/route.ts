import { NextResponse } from "next/server";
import { BIBLE_CACHE_CONTROL } from "@/lib/cache-control";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { getAvailableTranslations } from "@/lib/db/verse-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const translations = await getAvailableTranslations();
    return NextResponse.json(
      { translations },
      { headers: { "Cache-Control": BIBLE_CACHE_CONTROL } },
    );
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
