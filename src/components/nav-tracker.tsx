"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const NAV_COUNT_KEY = "rdh-nav-count";

/** Counts page views in this tab so the Back button knows whether there is a
 * previous page on this site to return to. */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      if (sessionStorage.getItem("rdh-last-path") === pathname) return;
      sessionStorage.setItem("rdh-last-path", pathname);
      const n = Number(sessionStorage.getItem(NAV_COUNT_KEY) ?? "0");
      sessionStorage.setItem(NAV_COUNT_KEY, String(n + 1));
    } catch {
      /* storage unavailable: Back falls back to the homepage */
    }
  }, [pathname]);
  return null;
}
