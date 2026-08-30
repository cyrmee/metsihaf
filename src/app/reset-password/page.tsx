import type { Metadata } from "next";
import { ResetPasswordClient } from "@/components/reset-password-client";

export const metadata: Metadata = {
  title: "Reset password — Metsihaf",
  robots: { index: false },
};

export default function Page() {
  return <ResetPasswordClient />;
}
