"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Columns2, Search, LibraryBig, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { getDarkMode, getReadingPosition, onStoreChange } from "@/lib/local-store";
import { useSession } from "@/lib/use-session";

/** Matches the "/read/BOOK/CHAPTER" or "/compare/BOOK/CHAPTER" a book/chapter page is currently on. */
const BOOK_CHAPTER_RE = /^\/(?:read|compare)\/([^/]+)\/(\d+)/;

/**
 * Where the Read and Compare tabs should point right now: the book/chapter
 * already on screen (just swapping page), else the last-viewed position
 * saved by either page, else Genesis 1 as a last resort. Without this, the
 * two tabs would always reset to GEN/1 and switching between them (or into
 * Search/Library/Settings and back) would silently lose your place.
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
 * A floating glass pill — icon-only at every breakpoint, bottom-center on
 * mobile and top-center on desktop. The active destination is marked in
 * indigo, the app's one accent.
 */
export function AppNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const bookChapter = useBookChapterSuffix(pathname);

  const navLinks = [
    { href: `/read/${bookChapter}`, label: "Read", icon: BookOpen, matchPrefix: "/read" },
    {
      href: `/compare/${bookChapter}`,
      label: "Compare",
      icon: Columns2,
      matchPrefix: "/compare",
    },
    { href: "/search", label: "Search", icon: Search, exact: true },
    { href: "/library", label: "Library", icon: LibraryBig, exact: true },
    { href: "/settings", label: "Settings", icon: Settings, exact: true },
  ];

  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle("dark", getDarkMode());
    };
    apply();
    return onStoreChange(apply);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full",
        "border border-border/50 bg-card/70 shadow-lg backdrop-blur-md",
        "px-2.5 py-2.5",
        "bottom-[calc(1rem+env(safe-area-inset-bottom))] md:top-4 md:bottom-auto",
      )}
    >
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
              "focus-carbon relative flex h-11 w-11 items-center justify-center rounded-full transition-colors",
              isActive
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {showAccountDot && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
