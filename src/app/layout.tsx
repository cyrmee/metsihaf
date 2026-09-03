import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { QueryProvider } from "@/components/query-provider";
import { AuthSyncProvider } from "@/components/auth-sync-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { OfflineInstallPrompt } from "@/components/offline-install-prompt";
import { OnlineStatusToast } from "@/components/online-status-toast";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Metsihaf",
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
  themeColor: "#e9e5da",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- rule targets the Pages Router; this is the App Router root layout */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Abyssinica+SIL&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Literata:ital,wght@0,400;0,500;0,600;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Ethiopic:wght@400;500;600;700&family=Noto+Serif+Ethiopic:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400&family=Space+Grotesk:wght@400..700&display=swap"
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        <OnlineStatusToast />
        <Toaster />
        <QueryProvider>
          <AuthSyncProvider>
            <div className="flex min-h-screen flex-col pb-[72px] md:pt-[84px] md:pb-0">
              <AppNav />
              <OfflineInstallPrompt />
              <main className="flex-1">{children}</main>
            </div>
          </AuthSyncProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
