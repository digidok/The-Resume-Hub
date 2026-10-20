import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DIVISIONS, availableServices, formatPrice } from "@/lib/catalog/divisions";

export const metadata = {
  title: "Business Solutions — The Resume Document Hub",
  description:
    "Business administration, executive and board support, HR and recruitment, data intelligence, background screening and AI automation through one central point of contact.",
};

export default function SolutionsPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">Business Solutions</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
              Every business service, one point of contact
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-200">
              Administration, HR, executive support, data, screening and automation, delivered by Resume Document Hub
              or by vetted specialists, with one team accountable from quote to delivery.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DIVISIONS.map((d) => {
              const services = availableServices(d);
              const priced = services.filter((s) => s.fromZar !== undefined);
              const cheapest = priced.length ? priced.reduce((a, b) => (a.fromZar! <= b.fromZar! ? a : b)) : null;
              return (
                <Link
                  key={d.slug}
                  href={d.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <h2 className="text-lg font-bold text-slate-900">{d.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-slate-600">{d.tagline}</p>
                  <p className="mt-4 text-xs text-slate-500">
                    {services.length} services · {cheapest ? formatPrice(cheapest) : "Request a quote"}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                    Explore <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Looking for career services?{" "}
            <Link href="/careers" className="font-medium text-brand-600 hover:underline">
              Explore Career Solutions
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
