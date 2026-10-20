"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NAV_COUNT_KEY } from "@/components/nav-tracker";

/** Goes back to the previous page on this site, or to the homepage when there is none. */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        let visited = 0;
        try {
          visited = Number(sessionStorage.getItem(NAV_COUNT_KEY) ?? "0");
        } catch {
          /* ignore */
        }
        if (visited > 1 && window.history.length > 1) router.back();
        else router.push("/");
      }}
      className={`inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-brand-700 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}
