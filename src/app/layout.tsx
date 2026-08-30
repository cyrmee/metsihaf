import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { QueryProvider } from "@/components/query-provider";
import { AuthSyncProvider } from "@/components/auth-sync-provider";

export const metadata: Metadata = {
  title: "Metsihaf — Bible Reader",
  description:
    "Read the Bible in Amharic 1954, NIV, ESV, NLT, and NASB with cross-references, parallel view, search, and personal study tools.",
  authors: [{ name: "Metsihaf" }],
  openGraph: {
    title: "Metsihaf — Bible Reader",
    description:
      "Read the Bible in Amharic 1954, NIV, ESV, NLT, and NASB with cross-references, parallel view, search, and personal study tools.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Apply saved dark-mode + theme-color before paint, so there's no flash of the defaults.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var d=JSON.parse(localStorage.getItem("bible.darkMode")||"false");
              var a=JSON.parse(localStorage.getItem("bible.accentTheme")||'"red"');
              document.documentElement.classList.toggle("dark",!!d);
              document.documentElement.setAttribute("data-accent",a);
            }catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- rule targets the Pages Router; this is the App Router root layout */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Noto+Serif+Ethiopic:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400&display=swap"
        />
      </head>
      <body>
        <QueryProvider>
          <AuthSyncProvider>
            <div className="flex min-h-screen flex-col pt-0 pb-28 md:pt-28 md:pb-0">
              <AppNav />
              <main className="flex-1">{children}</main>
              <footer className="pt-6 pb-4">
                <p className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
                  Amharic Bible text © United Bible Societies, used for non-commercial personal
                  study.
                </p>
              </footer>
            </div>
          </AuthSyncProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
