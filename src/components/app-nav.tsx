"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, LibraryBig, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { getReadingPosition, onStoreChange } from "@/lib/local-store";
import { useSession } from "@/lib/use-session";

/** Matches the "/read/BOOK/CHAPTER" a book/chapter page is currently on. */
const BOOK_CHAPTER_RE = /^\/read\/([^/]+)\/(\d+)/;

/**
 * Where the Read tab should point right now: the book/chapter already on
 * screen (just swapping page), else the last-viewed position saved by the
 * page, else Genesis 1 as a last resort. Without this, the tab would always
 * reset to GEN/1 and navigating into Search/Library/Settings and back would
 * silently lose your place.
 */
function useBookChapterSuffix(pathname: string): string {
  const [savedPos, setSavedPos] = useState<string | null>(null);
  useEffect(() => {
    const apply = () => {
      const pos = getReadingPosition();
      setSavedPos(pos ? `${pos.book}/${pos.chapter}` : null);
    };
    apply();
    return onStoreChange(apply);
  }, []);
  const onPage = BOOK_CHAPTER_RE.exec(pathname);
  if (onPage) return `${onPage[1]}/${onPage[2]}`;
  return savedPos ?? "GEN/1";
}

/**
 * An ink operational rail — a dark bar (top on desktop, bottom on mobile)
 * that reads as fixed chrome rather than a page element, in contrast to the
 * warm paper it sits above. Each destination carries a two-digit mono index
 * so the rail reads as an ordered register, not a row of icon buttons.
 * Active destination is marked in rust-red, the app's one action/attention
 * accent; every other label sits at a dimmed paper-white.
 */
export function AppNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const bookChapter = useBookChapterSuffix(pathname);

  const navLinks = [
    { index: "01", href: `/read/${bookChapter}`, label: "Read", icon: BookOpen, matchPrefix: "/read" },
    { index: "02", href: "/search", label: "Search", icon: Search, exact: true },
    { index: "03", href: "/library", label: "Library", icon: LibraryBig, exact: true },
    { index: "04", href: "/settings", label: "Settings", icon: Settings, exact: true },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-ink bg-ink md:top-0 md:bottom-auto md:justify-between md:border-t-0 md:border-b md:px-6"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="hidden items-center gap-3 py-5 md:flex">
        <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5 shrink-0">
          <rect width="32" height="32" fill="var(--color-paper-white)" />
          <rect x="6" y="7" width="9" height="18" fill="var(--color-ink)" />
          <rect x="17" y="7" width="9" height="18" fill="var(--color-ink)" />
          <rect x="15" y="7" width="2" height="18" fill="var(--color-signal)" />
        </svg>
        <span className="font-mono text-[14px] font-extrabold tracking-[0.2em] text-paper-white uppercase">
          METSIHAF
        </span>
      </span>

      <div className="flex w-full items-stretch justify-around md:w-auto md:justify-end">
        {navLinks.map((link) => {
          const isActive = link.matchPrefix
            ? pathname.startsWith(link.matchPrefix)
            : link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
          const Icon = link.icon;
          const showAccountDot = link.label === "Settings" && !!user;
          return (
            <Link
              key={link.label}
              href={link.href}
              aria-label={showAccountDot ? `${link.label} (signed in)` : link.label}
              aria-current={isActive ? "page" : undefined}
              title={link.label}
              className={cn(
                "focus-editorial group relative flex flex-1 flex-col items-center gap-1 border-t-2 py-2 md:flex-none md:flex-row md:gap-2.5 md:border-t-0 md:border-b-2 md:border-l md:border-l-paper-white/10 md:px-5 md:py-0",
                isActive ? "border-signal" : "border-transparent",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 md:hidden",
                  isActive ? "text-signal" : "text-paper-white/50",
                )}
              />
              <span
                className={cn(
                  "hidden font-mono text-[10px] tracking-[0.1em] md:inline",
                  isActive ? "text-signal" : "text-paper-white/35 group-hover:text-paper-white/60",
                )}
              >
                {link.index}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase md:text-[11px]",
                  isActive ? "text-signal" : "text-paper-white/70 group-hover:text-paper-white",
                )}
              >
                {link.label}
                {showAccountDot && (
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
