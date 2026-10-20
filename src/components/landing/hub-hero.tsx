import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Briefcase,
  FileText,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Repeat,
  Users,
  HeartHandshake,
} from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp-contacts";

const CONSULT_URL = whatsappLink("main", "Hi, I'd like to enquire about Resume Document Hub virtual assistant services");

const SERVICES = [
  { icon: Users, label: "Executive secretariat & board support", href: "/services#corporate" },
  { icon: FileText, label: "Document Studio: plans, packs, minutes, templates", href: "/services#studio" },
  { icon: Briefcase, label: "Business administration & registration", href: "/services#small-business" },
  { icon: Bot, label: "AI, automation & business systems", href: "/services#small-business" },
  { icon: GraduationCap, label: "CVs, jobs & career tools", href: "/careers" },
];

const HIGHLIGHTS = [
  { icon: UserCheck, label: "One accountable contact" },
  { icon: ShieldCheck, label: "Confidential by default" },
  { icon: Repeat, label: "Once-off or monthly retainer" },
  { icon: HeartHandshake, label: "Real human support" },
];

export function HubHero() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,147,63,0.18),transparent_55%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-block rounded-sm border border-accent-400/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-400">
              The Resume Document Hub · Single Point of Contact
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl sm:leading-[1.1]">
              One hub for your documents, career and business.
              <span className="block text-accent-400">One point of contact.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Virtual assistants for executives and boards, board-ready business documents, and CV
              and job tools, handled by one accountable contact from quote to delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={CONSULT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-brand-950 hover:bg-accent-50"
              >
                <MessageCircle className="h-4 w-4" />
                Request a consultation
              </a>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Explore our services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">What we handle</p>
            <ul className="mt-4 divide-y divide-white/10">
              {SERVICES.map((row) => (
                <li key={row.label}>
                  <Link
                    href={row.href}
                    className="group flex items-center gap-3 py-3 text-sm text-slate-100 hover:text-white"
                  >
                    <row.icon className="h-4 w-4 shrink-0 text-accent-400" />
                    <span className="flex-1">{row.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-accent-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 px-4 py-6 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <item.icon className="h-5 w-5 shrink-0 text-accent-600" />
              {item.label}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
