import Link from "next/link";
import { FileText, Share2, Briefcase, Sparkles, Users, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: FileText,
    title: "Resume builder",
    description:
      "Build a polished resume with a live preview, multiple templates, and one-click PDF export.",
  },
  {
    icon: Share2,
    title: "Shareable profile",
    description: "Publish a public link to your resume you can drop in any application or DM.",
  },
  {
    icon: Briefcase,
    title: "Job board",
    description: "Browse open roles and apply directly with a resume from your Resume Hub library.",
  },
  {
    icon: Sparkles,
    title: "AI resume review",
    description:
      "Get an ATS-style score and concrete feedback, optionally tailored to a specific job description.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-28">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-accent-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI-assisted resume review
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Build your resume. Get discovered. Land the job.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Resume Hub is a platform to build, share, and improve your resume — and apply to
              real jobs from employers using AI-assisted feedback along the way.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/signup">
                <Button size="lg">Create your resume</Button>
              </Link>
              <Link href="/jobs">
                <Button size="lg" variant="outlineInverse">
                  Browse jobs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Everything you need to get hired
            </h2>
            <p className="mt-2 text-slate-600">
              One place to build your resume, share it, and put it in front of real employers.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                className="p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-16 sm:grid-cols-2">
            <Card className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">For candidates</h3>
              <p className="mt-2 text-sm text-slate-600">
                Build a standout resume, get AI feedback tailored to the job you want, and apply
                without leaving the platform.
              </p>
              <Link href="/signup" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600">
                Get started as a candidate →
              </Link>
            </Card>
            <Card className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">For employers</h3>
              <p className="mt-2 text-sm text-slate-600">
                Post roles, review applicants with structured scorecards, and manage the full
                hiring pipeline from one dashboard.
              </p>
              <Link href="/signup" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600">
                Get started as an employer →
              </Link>
            </Card>
          </div>
        </section>
      </main>
      <footer className="bg-brand-950 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Resume Hub
      </footer>
    </div>
  );
}
