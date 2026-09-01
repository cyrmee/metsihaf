import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { QueryProvider } from "@/components/query-provider";
import { AuthSyncProvider } from "@/components/auth-sync-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "Metsihaf — Bible Reader",
  description:
    "Read the Bible in Amharic 1954, NIV, ESV, NLT, and NASB with cross-references, parallel view, search, and personal study tools.",
  authors: [{ name: "Metsihaf" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Metsihaf",
  },
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Apply saved dark-mode before paint, so there's no flash of the default theme.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var d=JSON.parse(localStorage.getItem("bible.darkMode")||"false");
              document.documentElement.classList.toggle("dark",!!d);
            }catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- rule targets the Pages Router; this is the App Router root layout */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Abyssinica+SIL&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600;700&family=Literata:ital,wght@0,400;0,500;0,600;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Ethiopic:wght@400;500;600;700&family=Noto+Serif+Ethiopic:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400&display=swap"
        />
      </head>
      <body>
        <ServiceWorkerRegister />
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
