import Link from "next/link";
import {
  FileText,
  Share2,
  Briefcase,
  Sparkles,
  Users,
  Building2,
  Check,
  ArrowRight,
  ScanSearch,
} from "lucide-react";
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

const STEPS = [
  {
    icon: FileText,
    title: "Build your resume",
    description: "Fill in your experience once — pick a template and see it update live.",
  },
  {
    icon: Sparkles,
    title: "Get AI feedback",
    description: "Run an ATS-style review and tighten it up before you apply.",
  },
  {
    icon: Briefcase,
    title: "Apply and get hired",
    description: "Share your profile or apply straight to open roles on the job board.",
  },
];

const REVIEW_CHECKS = [
  "ATS keyword coverage against the job description",
  "Clear, quantified impact statements",
  "Formatting and structure that pass automated screens",
];

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm py-4 sm:py-8">
      <div className="-rotate-2 rounded-2xl bg-white p-5 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
            JM
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Jordan Mensah</p>
            <p className="text-xs text-slate-500">Product Designer</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="h-2 w-full rounded-full bg-slate-100" />
          <div className="h-2 w-5/6 rounded-full bg-slate-100" />
          <div className="h-2 w-4/6 rounded-full bg-slate-100" />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Figma", "UX Research", "Prototyping"].map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-6 -right-4 rotate-3 rounded-xl bg-white p-4 shadow-xl shadow-black/20 sm:-right-8">
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "conic-gradient(#cc9a45 0deg 331deg, #e2e8f0 331deg 360deg)",
            }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
              92
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">ATS Score</p>
            <p className="text-xs text-emerald-600">Strong match</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-accent-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI-assisted resume review
              </span>
              <h1 className="mx-auto mt-5 max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:mx-0">
                Build your resume. Get discovered. Land the job.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300 lg:mx-0">
                Resume Hub is a platform to build, share, and improve your resume — and apply to
                real jobs from employers using AI-assisted feedback along the way.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/signup">
                  <Button size="lg">Create your resume</Button>
                </Link>
                <Link href="/jobs">
                  <Button size="lg" variant="outlineInverse">
                    Browse jobs
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-300 lg:justify-start">
                {["Free to get started", "No recruiter middleman", "AI feedback in seconds"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-accent-400" />
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
            <HeroMockup />
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

        <section className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">How it works</h2>
              <p className="mt-2 text-slate-600">Three steps from blank page to job offer.</p>
            </div>
            <div className="relative mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
              <div
                className="absolute left-0 right-0 top-6 hidden h-px bg-slate-200 sm:block"
                aria-hidden="true"
              />
              {STEPS.map((step, i) => (
                <div key={step.title} className="relative text-center">
                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm">
                    <step.icon className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <ScanSearch className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                Know exactly where your resume stands
              </h2>
              <p className="mt-2 text-slate-600">
                Run it through Resume Hub&apos;s AI review before you hit submit. It checks the
                things applicant tracking systems actually look for.
              </p>
              <ul className="mt-5 space-y-2.5">
                {REVIEW_CHECKS.map((check) => (
                  <li key={check} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {check}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="mt-6">
                  Try the AI review
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">ATS review</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  87 / 100
                </span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 w-[87%] rounded-full bg-brand-600" />
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  Strong quantified achievements in your last two roles
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  Add 3-4 more keywords from the job description
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">For candidates</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Build a standout resume, get AI feedback tailored to the job you want, and apply
                  without leaving the platform.
                </p>
                <Link
                  href="/signup"
                  className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600"
                >
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
                <Link
                  href="/signup"
                  className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600"
                >
                  Get started as an employer →
                </Link>
              </Card>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 py-16">
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to build a resume that gets you hired?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              It&apos;s free to get started — build your first resume in minutes.
            </p>
            <Link href="/signup">
              <Button size="lg" className="mt-6">
                Create your resume
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <footer className="bg-brand-950 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Resume Hub
      </footer>
    </div>
  );
}
