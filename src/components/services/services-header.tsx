import Link from "next/link";
import { MessageCircle } from "lucide-react";

const NAV = [
  { href: "#corporate", label: "Corporate & boards" },
  { href: "#studio", label: "Document Studio" },
  { href: "#small-business", label: "Small business" },
  { href: "#process", label: "How it works" },
  { href: "#contact", label: "Contact" },
];

export function ServicesMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-md border-b-2 border-accent-400 bg-brand-900 text-sm font-bold tracking-wider text-white ${className}`}
    >
      RDH
    </span>
  );
}

export function ServicesHeader({ ctaUrl }: { ctaUrl: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/services" className="flex items-center gap-3" aria-label="Resume Document Hub">
          <ServicesMark />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Resume Document Hub
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-widest text-accent-600 sm:block">
              Single Point of Contact
            </span>
          </span>
        </Link>
        <nav aria-label="Services" className="hidden items-center gap-7 text-sm font-medium text-slate-700 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-brand-700">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href={ctaUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Request a consultation</span>
          <span className="sm:hidden">Enquire</span>
        </a>
      </div>
    </header>
  );
}
