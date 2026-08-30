import type { Metadata } from "next";
import { SettingsClient } from "@/components/settings-client";

export const metadata: Metadata = {
  title: "Settings — Metsihaf Bible Reader",
  description: "Appearance, reading layout, text size and default translation preferences.",
};

export default function Page() {
  return <SettingsClient />;
}
