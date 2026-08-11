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
import { AnimatedHero } from "@/components/landing/animated-hero";
import { ResumeScanner } from "@/components/landing/resume-scanner";
import { JobMatchDemo } from "@/components/landing/job-match-demo";
import { ApplicationKitDemo } from "@/components/landing/application-kit-demo";
import { ApplicationPipeline } from "@/components/landing/application-pipeline";
import { CareerPassportPreview } from "@/components/landing/career-passport-preview";
import { CareerCoachDemo } from "@/components/landing/career-coach-demo";
import { HumanSupport } from "@/components/landing/human-support";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { ScrollReveal, ScrollStagger } from "@/components/motion/scroll-reveal";
import { MotionCard } from "@/components/motion/motion-card";
import { fadeUp } from "@/components/motion/variants";
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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <AnimatedHero />

        <section className="border-b border-slate-200 bg-white py-10">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 text-center sm:grid-cols-3">
            <ScrollReveal>
              <p className="text-3xl font-bold text-brand-700">
                <AnimatedCounter value={5} suffix="+ yrs" />
              </p>
              <p className="mt-1 text-sm text-slate-500">Writing CVs professionally</p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-3xl font-bold text-brand-700">
                <AnimatedCounter value={66788} duration={1.4} suffix="+" />
              </p>
              <p className="mt-1 text-sm text-slate-500">CVs written by our team since we started</p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-3xl font-bold text-brand-700">
                <AnimatedCounter value={100} suffix="%" />
              </p>
              <p className="mt-1 text-sm text-slate-500">Real human support, whenever you need it</p>
            </ScrollReveal>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Why job seekers trust Resume Hub
            </h2>
            <p className="mt-2 text-slate-600">
              Built to save you time and protect you from the scams and noise on other job boards.
            </p>
          </ScrollReveal>
          <ScrollStagger className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <MotionCard key={point.title}>
                <Card className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{point.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{point.description}</p>
                </Card>
              </MotionCard>
            ))}
          </ScrollStagger>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                See exactly how Resume Hub reads your CV
              </h2>
              <p className="mt-2 text-slate-600">
                No black box. Watch what gets checked before you ever hit submit.
              </p>
            </ScrollReveal>
            <div className="mt-12">
              <ResumeScanner />
            </div>
          </div>
        </section>

        <section id="job-match" className="mx-auto max-w-5xl px-4 py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Stop applying blindly.
            </h2>
            <p className="mt-2 text-slate-600">Know how well you match before you apply.</p>
          </ScrollReveal>
          <div className="mt-12">
            <JobMatchDemo />
          </div>
        </section>

        <section className="bg-brand-950 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                One job.
                <br />
                One complete application.
              </h2>
              <p className="mt-2 text-white/70">
                Tailored CV, cover letter, recruiter message and interview prep — built together.
              </p>
            </ScrollReveal>
            <div className="mt-12">
              <ApplicationKitDemo />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Never lose track of an opportunity.
            </h2>
            <p className="mt-2 text-slate-600">
              Every application, tracked from saved to hired.
            </p>
          </ScrollReveal>
          <div className="mt-14">
            <ApplicationPipeline />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Your career should never start from zero.
              </h2>
              <p className="mt-2 text-slate-600">
                Build your Career Passport once — Resume Hub uses it everywhere else.
              </p>
            </ScrollReveal>
            <div className="mt-12">
              <CareerPassportPreview />
            </div>
          </div>
        </section>

        <section id="career-coach" className="mx-auto max-w-5xl px-4 py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Meet your career coach.
            </h2>
            <p className="mt-2 text-slate-600">
              Straight answers about your CV, your search, and your next move.
            </p>
          </ScrollReveal>
          <div className="mt-12">
            <CareerCoachDemo />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-brand-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                AI when you want it.
                <br />
                Humans when you need them.
              </h2>
              <p className="mt-2 text-slate-600">
                Resume Hub pairs always-on AI with real Resume Specialists on WhatsApp.
              </p>
            </ScrollReveal>
            <div className="mt-12">
              <HumanSupport />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-4 py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Everything you need to move from job seeker to job offer.
            </h2>
            <p className="mt-2 text-slate-600">
              One place to build your resume, share it, and put it in front of real employers.
            </p>
          </ScrollReveal>
          <ScrollStagger className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <MotionCard key={feature.title}>
                <Card className="p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </Card>
              </MotionCard>
            ))}
          </ScrollStagger>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">How it works</h2>
              <p className="mt-2 text-slate-600">Three steps from blank page to job offer.</p>
            </ScrollReveal>
            <div className="relative mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
              <div
                className="absolute left-0 right-0 top-6 hidden h-px bg-slate-200 sm:block"
                aria-hidden="true"
              />
              {STEPS.map((step, i) => (
                <ScrollReveal key={step.title} delay={i * 0.1} className="relative text-center">
                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm">
                    <step.icon className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <ScrollReveal variants={fadeUp}>
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
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
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
            </ScrollReveal>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <ScrollReveal className="order-2 lg:order-1">
                <Card className="p-6">
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
              </ScrollReveal>
              <ScrollReveal delay={0.15} className="order-1 lg:order-2">
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
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Explore the candidate experience
              </h2>
              <p className="mt-2 text-slate-300">
                From match score to interview to offer — click through what candidates actually see.
              </p>
            </ScrollReveal>
            <div className="mt-12">
              <MatchShowcase />
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2" staggerChildren={0.15}>
              <MotionCard>
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
              </MotionCard>
              <MotionCard>
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
              </MotionCard>
            </ScrollStagger>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 py-20">
          <div
            className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -top-16 right-0 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
            aria-hidden="true"
          />
          <ScrollReveal className="relative mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Your next opportunity starts here.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              It&apos;s free to get started — build your first resume in minutes.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="solidInverse" className="mt-6">
                Build My CV Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </ScrollReveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
