import { NextResponse } from "next/server";
import type { TranslationId } from "@/lib/bible";
import { searchRows } from "@/lib/db/amharic-db";
import { toApiError } from "@/lib/db/handle-prisma-error";
import { asIn } from "@/lib/validation";

export const runtime = "nodejs";

const TRANSLATIONS: TranslationId[] = ["AMH", "NIV", "ESV", "NLT", "NASB"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const translation = asIn(searchParams.get("translation"), TRANSLATIONS, "translation");
    const query = searchParams.get("query") ?? "";
    if (query.length < 2) {
      return NextResponse.json(
        { statusCode: 400, error: "Bad Request", message: "query must be at least 2 characters." },
        { status: 400 },
      );
    }

    if (translation !== "AMH") {
      return NextResponse.json({ unavailable: `${translation} isn't available yet.` });
    }

    return NextResponse.json({ results: searchRows(query) });
  } catch (exception) {
    const err = toApiError(exception);
    return NextResponse.json(err.toBody(), { status: err.status });
  }
}
