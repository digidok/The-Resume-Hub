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
  Zap,
  BellRing,
  Mail,
  MessageCircle,
  ShieldCheck,
  Ban,
  Clock,
  Target,
  ListChecks,
  Flag,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MatchShowcase } from "@/components/landing/match-showcase";
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
  {
    icon: Zap,
    title: "Scheduled auto-apply",
    description:
      "Set your keywords once and we'll keep applying to new matching jobs every day — and email you when we do.",
  },
];

const AUTO_APPLY_POINTS = [
  "Save your keywords, location, and resume once",
  "We check for new matching jobs every day — no manual searching",
  "Get an email the moment we apply for you",
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

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "We avoid scams and junk",
    description: "We verify 100% of the job listings on our board before candidates ever see them.",
  },
  {
    icon: Ban,
    title: "High-quality listings, no ads",
    description: "No sponsored clutter or filler posts — just real, verified roles worth applying to.",
  },
  {
    icon: Clock,
    title: "Save time and hassle",
    description: "Auto-apply handles the repetitive searching and applying so you don't have to.",
  },
  {
    icon: Target,
    title: "Jobs that actually align",
    description: "Matching is based on your real skills and experience, not just keyword stuffing.",
  },
  {
    icon: ListChecks,
    title: "Personalised application tracking",
    description: "See exactly where every application stands, from submitted to hired.",
  },
  {
    icon: Flag,
    title: "The first of its kind in Africa",
    description: "Resume Hub is the first scheduled auto-apply service built for the African job market.",
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
              background: "conic-gradient(#ff7a45 0deg 331deg, #e2e8f0 331deg 360deg)",
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
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500">
          <div
            className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-accent-300/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <Sparkles className="h-3.5 w-3.5" />
                AI-assisted resume review
              </span>
              <h1 className="mx-auto mt-5 max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:mx-0">
                Build your resume. Get discovered. Land the job.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/90 lg:mx-0">
                Resume Hub is a platform to build, share, and improve your resume — and apply to
                real jobs from employers using AI-assisted feedback along the way.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/signup">
                  <Button size="lg" variant="solidInverse">
                    Create your resume
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="lg" variant="outlineInverse">
                    Browse jobs
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/90 lg:justify-start">
                {["Free to get started", "No recruiter middleman", "AI feedback in seconds"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-white" />
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
            <HeroMockup />
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-10">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 text-center sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-brand-700">5+ yrs</p>
              <p className="mt-1 text-sm text-slate-500">Writing CVs professionally</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-700">66,788+</p>
              <p className="mt-1 text-sm text-slate-500">CVs written by our team since we started</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-700">100%</p>
              <p className="mt-1 text-sm text-slate-500">Real human support, whenever you need it</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Why job seekers trust Resume Hub
            </h2>
            <p className="mt-2 text-slate-600">
              Built to save you time and protect you from the scams and noise on other job boards.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <Card key={point.title} className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <point.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{point.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{point.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-brand-50 py-14">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
              <MessageCircle className="h-6 w-6" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Prefer to talk to a real person?
            </h2>
            <p className="max-w-xl text-slate-600">
              Send your CV straight to our team on WhatsApp for a free review, or message us to
              get help building your resume. Follow us there for job-search tips and promos too.
            </p>
            <a href="https://wa.me/27693391915" target="_blank" rel="noreferrer">
              <Button size="lg" className="mt-2">
                <MessageCircle className="h-4 w-4" />
                Chat with us on WhatsApp
              </Button>
            </a>
            <p className="text-sm text-slate-500">069 339 1915</p>
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
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="bg-slate-900 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                See it in action
              </h2>
              <p className="mt-2 text-slate-300">
                From match score to interview to offer — click through what candidates actually see.
              </p>
            </div>
            <div className="mt-12">
              <MatchShowcase />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <Card className="order-2 p-6 lg:order-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white">
                    <BellRing className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-slate-400">Just now</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Auto-apply found new matches
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Resume Hub auto-applied to 3 new jobs for you.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    ["Frontend Engineer", "Acme Robotics"],
                    ["Product Designer", "Northwind Labs"],
                    ["React Developer", "Globex Software"],
                  ].map(([role, company]) => (
                    <div
                      key={role}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-slate-700">{role}</span>
                      <span className="text-slate-400">{company}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand-700">
                  <Mail className="h-3.5 w-3.5" />
                  Emailed to you
                </div>
              </Card>
              <div className="order-1 lg:order-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Zap className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  Let auto-apply do the searching for you
                </h2>
                <p className="mt-2 text-slate-600">
                  Turn on scheduled auto-apply once, and Resume Hub keeps applying to new
                  matching jobs on your behalf — even when you&apos;re not looking.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {AUTO_APPLY_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="mt-6">
                    Turn on auto-apply
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
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

        <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-accent-500 py-16">
          <div
            className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to build a resume that gets you hired?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              It&apos;s free to get started — build your first resume in minutes.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="solidInverse" className="mt-6">
                Create your resume
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
