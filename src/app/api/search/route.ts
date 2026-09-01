import { NextResponse } from "next/server";
import { BIBLE_CACHE_CONTROL } from "@/lib/cache-control";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { getAvailableTranslations, searchRows } from "@/lib/db/verse-db";
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
    const query = searchParams.get("query") ?? "";
    if (query.length < 2) {
      return NextResponse.json(
        { statusCode: 400, error: "Bad Request", message: "query must be at least 2 characters." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { results: await searchRows(translation, query) },
      { headers: { "Cache-Control": BIBLE_CACHE_CONTROL } },
    );
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
