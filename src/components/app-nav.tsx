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
 * A ruled masthead — a thin top bar with the wordmark and text nav links on
 * desktop, and a ruled bottom bar with icon+label pairs on mobile. Flat
 * paper, ink rules, no floating pill or blur. Active destination is marked
 * in rust-red, the app's one action/attention accent.
 */
export function AppNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const bookChapter = useBookChapterSuffix(pathname);

  const navLinks = [
    { href: `/read/${bookChapter}`, label: "Read", icon: BookOpen, matchPrefix: "/read" },
    { href: "/search", label: "Search", icon: Search, exact: true },
    { href: "/library", label: "Library", icon: LibraryBig, exact: true },
    { href: "/settings", label: "Settings", icon: Settings, exact: true },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-ink bg-paper md:top-0 md:bottom-auto md:justify-between md:border-t-0 md:border-b md:px-6 md:py-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="hidden font-mono text-[14px] font-extrabold tracking-[0.2em] text-ink uppercase md:flex md:items-center md:gap-3 md:py-5">
        METSIHAF
        <span aria-hidden="true" className="h-[2px] w-8 bg-signal" />
      </span>

      <div className="flex w-full items-stretch justify-around md:w-auto md:justify-end md:gap-1">
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
                "focus-editorial flex flex-col items-center gap-1 border-t-2 py-2 md:flex-row md:gap-2 md:border-t-0 md:border-b-2 md:px-4 md:py-5",
                isActive
                  ? "border-signal text-signal"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              <Icon className="h-5 w-5 md:hidden" />
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase md:text-[11px]">
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
