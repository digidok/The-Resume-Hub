"use client";

import { useEffect, useRef } from "react";
import { Bookmark, MousePointerClick, Sparkles } from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: Bookmark,
    title: "Drag the button to your bookmarks bar",
    description: "One time setup — no install, no browser store, no download.",
  },
  {
    icon: MousePointerClick,
    title: "Click it on any job listing",
    description: "Works on LinkedIn, Indeed, a company careers page — anywhere you're browsing.",
  },
  {
    icon: Sparkles,
    title: "It's saved to your Resume Hub dashboard",
    description: "Find it under Saved Jobs, ready to tailor and apply to.",
  },
];

export function SaveJobBookmarklet() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const origin = window.location.origin;
    const code =
      "(function(){" +
      "var t=document.title||'';" +
      "var u=window.location.href;" +
      "window.open('" +
      origin +
      "/api/saved-jobs/capture?title='+encodeURIComponent(t)+'&url='+encodeURIComponent(u),'_blank');" +
      "})();";
    // React 19 sanitizes javascript: URLs passed via the href prop, which
    // would silently break the bookmarklet — set it imperatively instead.
    linkRef.current?.setAttribute("href", `javascript:${code}`);
  }, []);

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <div>
        <Bookmark className="h-7 w-7 text-brand-600" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Save a job from anywhere on the web
        </h2>
        <p className="mt-2 text-slate-600">
          Found a role on LinkedIn, Indeed, or a company site? Drag this button to your bookmarks
          bar once — no extension install or browser store approval needed.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            ref={linkRef}
            onClick={(e) => {
              if (!linkRef.current?.getAttribute("href")) e.preventDefault();
            }}
            draggable
            className="inline-flex cursor-grab items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 active:cursor-grabbing"
          >
            <Bookmark className="h-4 w-4" />
            Save to Resume Hub
          </a>
          <span className="text-xs text-slate-400">↑ Drag this to your bookmarks bar</span>
        </div>
      </div>

      <div className="space-y-6">
        {HOW_IT_WORKS.map((step, i) => (
          <div key={step.title} className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-200">0{i + 1}</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-0.5 text-sm text-slate-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
