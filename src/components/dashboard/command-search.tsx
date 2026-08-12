"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, ClipboardList, Bookmark, Loader2 } from "lucide-react";
import type { SearchResult } from "@/app/api/dashboard/search/route";

const TYPE_META: Record<SearchResult["type"], { icon: typeof Briefcase; label: string }> = {
  job: { icon: Briefcase, label: "Job" },
  application: { icon: ClipboardList, label: "Application" },
  saved_job: { icon: Bookmark, label: "Saved" },
};

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const visibleResults = query.trim().length >= 2 ? results : [];

  function reset() {
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }

  function openSearch() {
    setOpen(true);
  }

  function closeSearch() {
    setOpen(false);
    reset();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (v) reset();
          return !v;
        });
      }
      if (e.key === "Escape") closeSearch();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    // Debounced fetch from an external API as the query changes — a
    // standard data-fetching effect; the loading flag mirrors that request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dashboard/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIndex(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function go(result: SearchResult) {
    closeSearch();
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && visibleResults[activeIndex]) {
      go(visibleResults[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Search jobs, applications, saved jobs…</span>
        <kbd className="hidden shrink-0 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-[12vh] backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close search"
            className="fixed inset-0 cursor-default"
            onClick={closeSearch}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20"
          >
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search jobs, companies, applications…"
                className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-300" />}
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim().length >= 2 && !loading && visibleResults.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No results for &ldquo;{query}&rdquo;.</p>
              )}
              {query.trim().length < 2 && (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  Type at least 2 characters to search.
                </p>
              )}
              {visibleResults.map((result, i) => {
                const Icon = TYPE_META[result.type].icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => go(result)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      i === activeIndex ? "bg-brand-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-slate-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{result.title}</span>
                      <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {TYPE_META[result.type].label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
