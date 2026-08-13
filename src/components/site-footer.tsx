import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const PRODUCT_LINKS = [
  { href: "/dashboard/resumes", label: "Resume builder" },
  { href: "/dashboard/ats-scanner", label: "AI resume review" },
  { href: "/dashboard/auto-apply", label: "Auto-apply" },
  { href: "/jobs", label: "Job board" },
  { href: "/pricing", label: "Pricing" },
];

const COMPANY_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/student-discount", label: "Student discount" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export function SiteFooter() {
  return (
    <footer className="bg-brand-950 py-14 text-slate-400">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo variant="inverse" tagline />
            <p className="mt-3 max-w-[16rem] text-sm text-slate-400">
              CVs, job matching, and AI-assisted applications for candidates across South Africa,
              the Middle East, Asia, and beyond.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                Sandton, Johannesburg
              </li>
              <li>
                <a
                  href="mailto:info@resumehub.co.za"
                  className="flex items-start gap-1.5 hover:text-white"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                  info@resumehub.co.za
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/27693391915"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-1.5 hover:text-white"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                  WhatsApp: 069 339 1915
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Resume Hub
        </p>
      </div>
    </footer>
  );
}
