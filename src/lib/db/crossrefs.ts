import "server-only";
import path from "node:path";
import { readFileSync } from "node:fs";

let crossRefs: Record<string, string[]> | null = null;

export function loadCrossrefs(): Record<string, string[]> {
  if (!crossRefs) {
    const raw = readFileSync(path.join(process.cwd(), "src/data/crossrefs.json"), "utf-8");
    crossRefs = JSON.parse(raw) as Record<string, string[]>;
  }
  return crossRefs;
}
