import { useSyncExternalStore } from "react";
import { onStoreChange } from "@/lib/local-store";

let version = 0;

/** Bumps whenever local study data (bookmarks/highlights/notes) changes. */
export function useStoreVersion(): number {
  return useSyncExternalStore(
    (cb) =>
      onStoreChange(() => {
        version += 1;
        cb();
      }),
    () => version,
    () => version,
  );
}
