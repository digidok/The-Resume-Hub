import { ArrowRight, Briefcase, Building2, FileText, GraduationCap, Mail, MessageCircle, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HubHero } from "@/components/landing/hub-hero";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { whatsappLink } from "@/lib/whatsapp-contacts";

const CONSULT_URL = whatsappLink("main", "Hi, I'd like to enquire about Resume Document Hub virtual assistant services");

const PILLARS = [
  { icon: Users, title: "Executive & board support", text: "Secretariat, governance documentation and board packs, delivered with discretion.", href: "/services#corporate", cta: "Explore support" },
  { icon: FileText, title: "Document Studio", text: "Business plans, proposals, minutes and branded templates prepared to your brand.", href: "/services#studio", cta: "Start a request" },
  { icon: Briefcase, title: "Business administration", text: "Company registration, everyday admin and automation for growing businesses.", href: "/services#small-business", cta: "See services" },
  { icon: GraduationCap, title: "Careers", text: "Professional CVs, verified jobs, ATS scoring and interview preparation.", href: "/careers", cta: "Go to Careers" },
  { icon: Building2, title: "For employers", text: "Post jobs, review candidates, and use induction and offer letter tools.", href: "/careers#employers", cta: "For employers" },
  { icon: Wallet, title: "Pricing", text: "Transparent plans for individuals and clear starting prices for businesses.", href: "/pricing", cta: "View pricing" },
];

const PRICE_POINTS = [
  { label: "CIPC company registration", price: "R650" },
  { label: "Small business admin, from", price: "R1,499/mo" },
  { label: "Executive office support, from", price: "R7,500/mo" },
];

const STEPS = [
  { title: "Tell us what you need", text: "Message us on WhatsApp or email with the task, the deadline and who it is for." },
  { title: "We scope and quote", text: "You receive a clear scope and price, either once-off or as a monthly package." },
  { title: "One contact delivers", text: "Your assistant manages the work and keeps you updated until it is complete." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <HubHero />

        {/* What we do */}
        <section id="hub" className="py-16">
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
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar.title}
                  href={pillar.href}
                  className="group flex flex-col rounded-md border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-300"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-900 text-accent-400">
                    <pillar.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{pillar.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-slate-600">{pillar.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    {pillar.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

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
                  Indicative starting prices. Every request is scoped and quoted before work begins.
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
            <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PRICE_POINTS.map((item) => (
                <div key={item.label} className="rounded-md border border-white/10 bg-white/5 p-5">
                  <dt className="text-sm text-slate-300">{item.label}</dt>
                  <dd className="mt-1 text-2xl font-bold text-white">{item.price}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                How it works
              </h2>
              <p className="mt-2 text-slate-600">One accountable contact from first message to finished work.</p>
            </ScrollReveal>
            <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="font-mono text-sm font-semibold text-accent-600">0{i + 1}</span>
                  <p className="mt-3 font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-brand-900 py-14 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Speak to one person who owns it end to end
              </h2>
              <p className="mt-2 text-slate-300">
                Reach us on WhatsApp or email and we will respond with a scope and quote.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={CONSULT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-brand-950 hover:bg-accent-50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
              <a
                href="mailto:info@resumehub.co.za"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
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
