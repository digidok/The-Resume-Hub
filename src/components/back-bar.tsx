"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/back-button";

/** A slim "Back" bar shown at the top of every page except the homepage.
 * The dashboard has its own Back button inside its header. */
export function BackBar() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/dashboard")) return null;
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-2">
        <BackButton />
      </div>
    </div>
  );
}
