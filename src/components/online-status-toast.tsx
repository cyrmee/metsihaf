"use client";

import { useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

/** Toasts when the connection drops or comes back — no UI of its own beyond that. */
export function OnlineStatusToast() {
  useEffect(() => {
    const onOffline = () =>
      toast("You're offline", {
        description: "Downloaded chapters still work. Changes will sync once you're back.",
        icon: <WifiOff className="h-4 w-4 text-highlight-red" />,
      });
    const onOnline = () =>
      toast("Back online", { icon: <Wifi className="h-4 w-4 text-highlight-green" /> });

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
