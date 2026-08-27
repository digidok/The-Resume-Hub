import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { CV_EXAMPLES } from "@/lib/cv-examples";

export const metadata = {
  title: "CV Examples — Resume Hub",
  description:
    "Real, complete CV examples across different fields and career stages — built with Resume Hub's templates. See what a strong CV looks like, then build your own.",
};

export default function CvExamplesPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">CV examples</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Three complete, real-world CVs — different fields, different career stages — built with
            Resume Hub templates. See exactly what a CV that gets interviews looks like, then build
            your own from scratch or from one of these.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {CV_EXAMPLES.map((example) => (
              <Link
                key={example.slug}
                href={`/cv-examples/${example.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  {example.seniority}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{example.role}</h2>
                <p className="text-sm text-slate-500">{example.industry}</p>
                <p className="mt-3 flex-1 text-sm text-slate-600">{example.blurb}</p>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-700">
                  View full CV
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-14 rounded-2xl bg-brand-950 p-8 text-center sm:p-10">
            <h2 className="text-xl font-bold text-white">Ready to build yours?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
              Start from a blank CV or import your existing one — 100+ templates, AI review, and
              ATS scoring, unlimited on every plan.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/signup">
                <Button>Build my CV</Button>
              </Link>
              <Link href="/dashboard/import">
                <Button variant="outlineInverse">Import an existing CV</Button>
              </Link>
            </div>
            <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Plans from R99/month
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
