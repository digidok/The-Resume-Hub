import { ArrowRight, Building2, Check, GraduationCap, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HubHero } from "@/components/landing/hub-hero";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/whatsapp-contacts";

const CONSULT_URL = whatsappLink("main", "Hi, I'd like to enquire about Resume Document Hub virtual assistant services");

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

        {/* One hub, two paths */}
        <section id="hub" className="py-16">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">
                The Resume Document Hub
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                One hub. Two ways we help.
              </h2>
              <p className="mt-2 text-slate-600">
                Whether you are building a career or running a business, one accountable contact
                takes it from request to delivery.
              </p>
            </ScrollReveal>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-md bg-brand-950 p-7 text-white shadow-sm">
                <Building2 className="h-7 w-7 text-accent-400" />
                <h3 className="mt-4 text-xl font-semibold">Businesses, executives &amp; boards</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Virtual assistants and document support for senior teams: delivered with
                  precision, discretion and accountability.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-slate-200">
                  {["Executive secretariat and board support", "Board packs, minutes and governance registers", "Document Studio: plans, proposals, templates", "Company registration and business admin"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 rounded-md bg-accent-400 px-5 py-2.5 text-sm font-semibold text-brand-950 hover:bg-accent-50"
                  >
                    Explore business services
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/services#studio"
                    className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Start a document request
                  </Link>
                </div>
              </div>
              <div className="flex flex-col rounded-md border border-slate-200 bg-white p-7 shadow-sm">
                <GraduationCap className="h-7 w-7 text-brand-700" />
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Individuals &amp; job seekers</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Professional CVs, ATS scoring, job matching and scheduled auto-apply, with real
                  human support.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700">
                  {["CV builder with 100+ templates", "ATS and keyword checker", "Verified job board and auto-apply", "Cover letters and interview prep"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3 pt-2">
                  <Link href="/signup">
                    <Button>Build or Upload My CV</Button>
                  </Link>
                  <Link href="/jobs">
                    <Button variant="outline">Browse jobs</Button>
                  </Link>
                </div>
              </div>
            </div>
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
