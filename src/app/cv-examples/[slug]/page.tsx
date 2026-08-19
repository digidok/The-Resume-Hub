import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/resume/resume-preview";
import { CV_EXAMPLES } from "@/lib/cv-examples";

export function generateStaticParams() {
  return CV_EXAMPLES.map((example) => ({ slug: example.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const example = CV_EXAMPLES.find((e) => e.slug === slug);
    return {
      title: example ? `${example.role} CV Example — Resume Hub` : "CV Example — Resume Hub",
      description: example?.blurb,
    };
  });
}

export default async function CvExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = CV_EXAMPLES.find((e) => e.slug === slug);
  if (!example) notFound();

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link href="/cv-examples" className="flex items-center gap-1.5 text-sm text-brand-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            All CV examples
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{example.role} CV example</h1>
              <p className="mt-1 text-sm text-slate-500">
                {example.industry} · {example.seniority}
              </p>
            </div>
            <Link href="/signup">
              <Button>Use this as a starting point</Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ResumePreview content={example.content} template={example.template} />
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-semibold text-slate-900">Why this CV works</p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {example.whyItWorks.map((point) => (
                    <li key={point} className="text-sm leading-relaxed text-slate-600">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-brand-950 p-5 text-center">
                <p className="text-sm font-semibold text-white">Build your own free CV</p>
                <p className="mt-1.5 text-xs text-slate-300">
                  Free templates, AI review, and ATS scoring — no credit card required.
                </p>
                <Link href="/signup" className="mt-4 block">
                  <Button className="w-full">Get started free</Button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
