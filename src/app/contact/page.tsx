import Link from "next/link";
import { CalendarCheck, Mail, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DIVISIONS } from "@/lib/catalog/divisions";
import { whatsappLink } from "@/lib/whatsapp-contacts";

export const metadata = {
  title: "Contact — The Resume Document Hub",
  description: "Request a business consultation or get in touch with The Resume Document Hub on WhatsApp or email.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">Contact</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Request a business consultation</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-200">
              Speak to one point of contact. We will route your request to the right team and come back with a scope and
              quotation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book?type=business-consultation"
                className="inline-flex items-center gap-2 rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-brand-950 hover:bg-accent-50"
              >
                <CalendarCheck className="h-4 w-4" />
                Book a time
              </Link>
              <a
                href={whatsappLink("main", "Hi, I'd like to request a business consultation.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
              <a
                href="mailto:info@resumehub.co.za"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                <Mail className="h-4 w-4" />
                info@resumehub.co.za
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Send an enquiry for a specific service</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIVISIONS.map((d) => (
              <Link
                key={d.slug}
                href={`${d.href}#enquiry`}
                className="rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-sm"
              >
                <p className="font-semibold text-slate-900">{d.title}</p>
                <p className="mt-1 text-sm text-slate-600">{d.tagline}</p>
              </Link>
            ))}
            <Link href="/careers" className="rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-sm">
              <p className="font-semibold text-slate-900">Career Solutions</p>
              <p className="mt-1 text-sm text-slate-600">CVs, jobs, Auto Apply and career guidance for individuals.</p>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
