"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Columns2, Search, LibraryBig, Settings, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { getAccentTheme, getDarkMode, setDarkMode, onStoreChange } from "@/lib/local-store";

const NAV_LINKS = [
  { href: "/read/GEN/1", label: "Read", icon: BookOpen, matchPrefix: "/read" },
  { href: "/compare/GEN/1", label: "Compare", icon: Columns2, matchPrefix: "/compare" },
  { href: "/search", label: "Search", icon: Search, exact: true },
  { href: "/library", label: "Library", icon: LibraryBig, exact: true },
  { href: "/settings", label: "Settings", icon: Settings, exact: true },
];

/**
 * The one rounded, floating element in an otherwise sharp-cornered
 * "manuscript page" design language — icon-only at every breakpoint,
 * bottom-center on mobile and top-center on desktop. The active
 * destination is marked in rubric red, the way a scribe flagged a heading.
 */
export function AppNav() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const apply = () => {
      const on = getDarkMode();
      setDark(on);
      document.documentElement.classList.toggle("dark", on);
      document.documentElement.setAttribute("data-accent", getAccentTheme());
    };
    apply();
    return onStoreChange(apply);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5",
        "rounded-full border border-border/70 bg-card/85 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl",
        "px-2.5 py-2.5",
        "bottom-[calc(1rem+env(safe-area-inset-bottom))] md:top-4 md:bottom-auto",
      )}
    >
      {NAV_LINKS.map((link) => {
        const isActive = link.matchPrefix
          ? pathname.startsWith(link.matchPrefix)
          : link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-label={link.label}
            aria-current={isActive ? "page" : undefined}
            title={link.label}
            className={cn(
              "focus-carbon flex h-11 w-11 items-center justify-center rounded-full transition-colors",
              isActive
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}

      <button
        type="button"
        aria-label="Toggle dark mode"
        onClick={() => setDarkMode(!dark)}
        className="focus-carbon ml-1 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </nav>
  );
}
