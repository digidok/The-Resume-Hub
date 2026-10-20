import { ArrowRight, BarChart3, Bot, Briefcase, GraduationCap, HardHat, Mail, MessageCircle, ScanSearch, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HubHero } from "@/components/landing/hub-hero";
import { HubStats } from "@/components/landing/hub-stats";
import { ClientsStrip } from "@/components/clients/clients-strip";
import { OpenPositions } from "@/components/landing/open-positions";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { whatsappLink } from "@/lib/whatsapp-contacts";
import {
  INTERVIEW_PACK_PACKAGES,
  SUBSCRIPTION_PACKAGES,
  WHATSAPP_ORDER_PRICING,
} from "@/lib/payfast/config";

const CONSULT_URL = whatsappLink("main", "Hi, I'd like to enquire about Resume Document Hub virtual assistant services");

const PILLARS = [
  { icon: GraduationCap, title: "Career Solutions", text: "Professional CVs, Auto Apply, verified jobs and interview preparation for individuals.", href: "/careers", cta: "Explore careers" },
  { icon: Briefcase, title: "Business administration", text: "Company registration, virtual assistants and business documents, once-off or monthly.", href: "/solutions/business-administration", cta: "See services" },
  { icon: Users, title: "Executive & board support", text: "Board packs, minutes, transcription and executive assistance, delivered with discretion.", href: "/services", cta: "Explore support" },
  { icon: UserCheck, title: "HR & recruitment", text: "Recruitment, employment documents and HR administration you can outsource.", href: "/solutions/hr-recruitment", cta: "See HR services" },
  { icon: BarChart3, title: "Data science & BI", text: "Reports, dashboards and HR analytics that turn business data into decisions.", href: "/solutions/data-intelligence", cta: "See analytics" },
  { icon: ScanSearch, title: "Background screening", text: "Employment screening and verification coordinated with authorised providers.", href: "/solutions/background-screening", cta: "Request a quote" },
  { icon: Bot, title: "Digital & AI automation", text: "WhatsApp, lead capture, reminders and reporting workflows that save time.", href: "/solutions/ai-automation", cta: "See automation" },
  { icon: HardHat, title: "Labour broking", text: "Staff placed with you, employed and paid by us. We run the payroll and administration.", href: "/solutions/labour-broking", cta: "See staffing" },
];

const BUSINESS_PRICE_POINTS = [
  { label: "CIPC company registration", price: "R650" },
  { label: "Small business admin, from", price: "R1,499/mo" },
  { label: "Executive office support, from", price: "R7,500/mo" },
];

// Lowest price first. `amount` is only used for ordering.
const CAREER_PRICE_POINTS = [
  {
    label: "Candidate Pro, auto-apply & AI tools",
    amount: SUBSCRIPTION_PACKAGES.find((p) => p.id === "candidate_pro")?.amountZar ?? 99,
    suffix: "/mo",
  },
  { label: "CV & cover letter, done for you", amount: WHATSAPP_ORDER_PRICING.cv_cover_letter, suffix: "" },
  { label: "Interview preparation, from", amount: Math.min(...INTERVIEW_PACK_PACKAGES.map((p) => p.amountZar)), suffix: "" },
  { label: "LinkedIn profile revamp", amount: WHATSAPP_ORDER_PRICING.linkedin_revamp, suffix: "" },
]
  .sort((x, y) => x.amount - y.amount)
  .map((p) => ({ label: p.label, price: `R${p.amount}${p.suffix}` }));


export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <HubHero />
        <HubStats />
        <ClientsStrip />

        {/* What we do */}
        <section id="hub" className="bg-gradient-to-b from-white via-brand-50/60 to-white py-20">
          <div className="mx-auto max-w-6xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">
                What we do
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Everything handled through one accountable contact
              </h2>
              <p className="mt-2 text-slate-600">
                Whether you are running a business, serving on a board or building a career.
              </p>
            </ScrollReveal>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar, i) => (
                <ScrollReveal key={pillar.title} delay={(i % 4) * 0.07} className="h-full">
                  <Link
                    href={pillar.href}
                    className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-950/10"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-accent-400 to-brand-500 transition-transform duration-500 group-hover:scale-x-100"
                    />
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-accent-400 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <pillar.icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">{pillar.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{pillar.text}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                      {pillar.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <OpenPositions count={4} />

        {/* Pricing teaser */}
        <section className="bg-brand-950 py-14 text-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-400">Pricing</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Clear pricing, once-off or monthly
                </h2>
                <p className="mt-2 text-slate-300">
                  Starting prices for business support are indicative and quoted before work begins. CV and career prices are fixed.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/services#small-business"
                  className="inline-flex items-center gap-2 rounded-md bg-accent-400 px-5 py-2.5 text-sm font-semibold text-brand-950 hover:bg-accent-50"
                >
                  Business pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  CV &amp; career plans
                </Link>
              </div>
            </div>
            <h3 className="mt-8 text-xs font-semibold uppercase tracking-widest text-slate-300">
              Business &amp; executive support
            </h3>
            <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {BUSINESS_PRICE_POINTS.map((item) => (
                <Link
                  key={item.label}
                  href="/pricing#business-pricing"
                  className="rounded-md border border-white/10 bg-white/5 p-5 transition hover:border-accent-400/60 hover:bg-white/10"
                >
                  <dt className="text-sm text-slate-300">{item.label}</dt>
                  <dd className="mt-1 text-2xl font-bold text-white">{item.price}</dd>
                  <span className="mt-2 inline-block text-xs font-medium text-accent-400">What&apos;s included →</span>
                </Link>
              ))}
            </dl>
            <h3 className="mt-8 text-xs font-semibold uppercase tracking-widest text-slate-300">
              CVs &amp; careers
            </h3>
            <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CAREER_PRICE_POINTS.map((item) => (
                <Link
                  key={item.label}
                  href="/careers#career-services"
                  className="rounded-md border border-white/10 bg-white/5 p-5 transition hover:border-accent-400/60 hover:bg-white/10"
                >
                  <dt className="text-sm text-slate-300">{item.label}</dt>
                  <dd className="mt-1 text-2xl font-bold text-white">{item.price}</dd>
                  <span className="mt-2 inline-block text-xs font-medium text-accent-400">What&apos;s included →</span>
                </Link>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-brand-50 py-14">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Speak to one person who owns it end to end
              </h2>
              <p className="mt-2 text-slate-600">
                Reach us on WhatsApp or email and we will respond with a scope and quote.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={CONSULT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
              <a
                href="mailto:info@resumehub.co.za"
                className="inline-flex items-center gap-2 rounded-md border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-800 hover:border-brand-400"
              >
                <Mail className="h-4 w-4" />
                Email us
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
