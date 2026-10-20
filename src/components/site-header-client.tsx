"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { AskElsButton } from "@/components/ask-els/ask-els-button";

const CAREERS_LINKS = [
  { href: "/signup", label: "Build My CV", note: "Build or upload your CV" },
  { href: "/jobs", label: "Jobs", note: "Verified roles and auto-apply" },
  { href: "/#career-coach", label: "Career Coach", note: "Interview prep and guidance" },
];

const NAV_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/services", label: "Services" },
  { href: "/#employers", label: "For Employers", accent: true },
];

export function SiteHeaderClient({ isSignedIn }: { isSignedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200 bg-white/80 py-2.5 shadow-sm backdrop-blur-md"
          : "border-transparent bg-white py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <Link href="/" onClick={() => setMenuOpen(false)}>
          <Logo tagline />
        </Link>
        <nav className="hidden items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-1 text-sm font-semibold text-slate-700 lg:flex">
          <div className="group relative">
            <button
              type="button"
              aria-haspopup="menu"
              className="flex items-center gap-1 whitespace-nowrap rounded-sm px-2.5 py-1.5 transition-colors hover:bg-white hover:text-brand-700 hover:shadow-sm group-focus-within:bg-white group-focus-within:text-brand-700"
            >
              Careers
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="w-64 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
                {CAREERS_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block rounded-sm px-3 py-2 hover:bg-brand-50"
                  >
                    <span className="block text-sm font-semibold text-slate-900">{link.label}</span>
                    <span className="block text-xs font-normal text-slate-500">{link.note}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                link.accent
                  ? "whitespace-nowrap rounded-sm px-2.5 py-1.5 text-accent-600 transition-colors hover:bg-white hover:text-accent-700 hover:shadow-sm"
                  : "whitespace-nowrap rounded-sm px-2.5 py-1.5 transition-colors hover:bg-white hover:text-brand-700 hover:shadow-sm"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 sm:gap-4">
          <AskElsButton />
          {isSignedIn ? (
            <Link href="/dashboard" className="hidden sm:block">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden hover:text-brand-700 sm:inline">
                Sign in
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Careers</p>
            {CAREERS_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 pl-6 hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-1 border-t border-slate-100" />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  link.accent
                    ? "rounded-lg px-3 py-2.5 text-accent-600 hover:bg-accent-50 hover:text-accent-700"
                    : "rounded-lg px-3 py-2.5 hover:bg-brand-50 hover:text-brand-700"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {isSignedIn ? (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
