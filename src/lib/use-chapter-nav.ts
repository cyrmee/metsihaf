"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SWIPE_MIN_DISTANCE = 60;
/** Max vertical drift allowed for a gesture to still count as a horizontal swipe (not a scroll). */
const SWIPE_MAX_DRIFT = 80;

interface ChapterNavOptions {
  prevHref: string | null;
  nextHref: string | null;
  /** Suppress both bindings, e.g. while a modal with its own input is open. */
  disabled?: boolean;
}

/** Left/Right arrow keys and horizontal swipes move to the neighboring chapter. */
export function useChapterNavigation({ prevHref, nextHref, disabled }: ChapterNavOptions) {
  const router = useRouter();

  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key === "ArrowLeft" && prevHref) router.push(prevHref);
      else if (e.key === "ArrowRight" && nextHref) router.push(nextHref);
    };

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || e.touches.length > 1) return;
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dy) > SWIPE_MAX_DRIFT) return;
      if (dx < 0 && nextHref) router.push(nextHref);
      else if (dx > 0 && prevHref) router.push(prevHref);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [prevHref, nextHref, disabled, router]);
}
