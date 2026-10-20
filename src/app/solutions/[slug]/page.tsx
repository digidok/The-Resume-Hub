import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Check, Info, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EnquiryForm } from "@/components/solutions/enquiry-form";
import { DIVISIONS, availableServices, getDivision } from "@/lib/catalog/divisions";
import { ServiceCard } from "@/components/solutions/service-card";
import { getAnyDivisionWithOverrides } from "@/lib/catalog/overrides";
import { whatsappLink } from "@/lib/whatsapp-contacts";

// Executive & board support has its own richer page at /services.
const SLUGS = DIVISIONS.filter((d) => d.href.startsWith("/solutions/")).map((d) => d.slug);

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  const division = getDivision(slug);
  if (!division) return {};
  return {
    title: `${division.title} — The Resume Document Hub`,
    description: `${division.tagline} ${division.intro}`,
  };
}

export default async function SolutionPage({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  const division = await getAnyDivisionWithOverrides(slug);
  if (!division || !SLUGS.includes(slug)) notFound();
  const services = availableServices(division);

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">Business Solutions</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{division.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-200">{division.tagline}</p>
            <p className="mt-3 max-w-2xl text-slate-300">{division.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#enquiry"
                className="rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-brand-950 hover:bg-accent-50"
              >
                Request a quote
              </a>
              <Link
                href={`/book?type=${["hr-recruitment", "labour-broking", "background-screening"].includes(division.slug) ? "screening-call" : "business-consultation"}`}
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                <CalendarCheck className="h-4 w-4" />
                Book a consultation
              </Link>
              <a
                href={whatsappLink("main", `Hi, I'd like to talk about ${division.title}.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-3 text-sm font-semibold text-slate-200 underline-offset-4 hover:text-white hover:underline"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Services</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-12">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Info className="h-4 w-4" /> Who delivers this
              </h2>
              <p className="mt-2 text-sm text-slate-700">{division.fulfilment}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Good to know</h2>
              <ul className="mt-2 space-y-2">
                {division.notices.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="enquiry" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Request a quote</h2>
          <p className="mt-2 text-sm text-slate-600">
            Tell us what you need. We will acknowledge your enquiry straight away and send a quotation for your
            approval before any work starts.
          </p>
          <div className="mt-6">
            <EnquiryForm division={division} />
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-10 text-center">
          <Link href="/solutions" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            See all business solutions
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
