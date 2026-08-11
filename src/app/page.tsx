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
  Upload,
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
import { EmployerShowcase } from "@/components/landing/employer-showcase";
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
    icon: Upload,
    title: "Upload or build your CV",
    description: "Import an existing CV or build one from scratch with our AI-powered editor.",
  },
  {
    icon: Target,
    title: "Match with jobs",
    description: "Our AI scores your fit for every open role — real percentages, not guesswork.",
  },
  {
    icon: Zap,
    title: "Auto-apply for you",
    description: "Turn on scheduled auto-apply and let Resume Hub keep applying on your behalf.",
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

        <section className="mx-auto max-w-5xl px-4 pb-20 pt-24 sm:pt-28">
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
                <Card className="border-0 border-l-[3px] border-brand-400 bg-gradient-to-br from-white to-brand-50/50 p-6 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <point.icon className="h-5 w-5 shrink-0 text-brand-600" />
                    <h3 className="text-base font-semibold text-slate-900">{point.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{point.description}</p>
                </Card>
              </MotionCard>
            ))}
          </ScrollStagger>
        </section>

        <section id="cv-scanner" className="border-y border-slate-200 bg-slate-50 py-20">
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

        <section id="application-kit" className="bg-brand-950 py-20">
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

        <section id="pipeline" className="mx-auto max-w-5xl px-4 py-20">
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
            <span className="inline-block rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Powerful Features
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Everything you need to{" "}
              <span className="text-brand-600">move from job seeker to job offer</span>.
            </h2>
            <p className="mt-2 text-slate-600">
              One place to build your resume, share it, and put it in front of real employers.
            </p>
          </ScrollReveal>
          <ScrollStagger className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <MotionCard key={feature.title}>
                <Card className="border-0 border-t-[3px] border-brand-500 bg-gradient-to-br from-white to-brand-50/40 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-500/10">
                  <feature.icon className="h-6 w-6 text-brand-600" />
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </Card>
              </MotionCard>
            ))}
          </ScrollStagger>
        </section>

        <section className="border-y border-slate-200 bg-gradient-to-b from-brand-50/50 via-white to-white py-20">
          <div className="mx-auto max-w-5xl px-4">
            <ScrollReveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">How It Works</h2>
              <p className="mt-2 text-slate-600">
                Three simple steps to revolutionise your job search.
              </p>
            </ScrollReveal>
            <ScrollStagger className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <MotionCard key={step.title}>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-brand-200">0{i + 1}</span>
                      <step.icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
                  </div>
                </MotionCard>
              ))}
            </ScrollStagger>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <ScrollReveal variants={fadeUp}>
              <ScanSearch className="h-7 w-7 text-brand-600" />
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
                <Zap className="h-7 w-7 text-brand-600" />
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
                  <Button variant="secondary" className="mt-6">
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
                <Card className="border-0 border-b-[3px] border-brand-500 bg-gradient-to-br from-white to-brand-50/40 p-6">
                  <div className="flex items-center gap-2.5">
                    <Users className="h-5 w-5 text-brand-600" />
                    <h3 className="text-lg font-semibold text-slate-900">For candidates</h3>
                  </div>
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
                <Card className="border-0 border-b-[3px] border-accent-500 bg-gradient-to-br from-white to-accent-50/40 p-6">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-5 w-5 text-accent-600" />
                    <h3 className="text-lg font-semibold text-slate-900">For employers</h3>
                  </div>
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

        <section className="border-y border-slate-200 bg-brand-50/40 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <EmployerShowcase />
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4">
            <ScrollReveal className="rounded-3xl bg-gradient-to-br from-brand-50 to-accent-50/60 p-8 text-center shadow-sm sm:p-10">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Ready to find your next great hire?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                Post your first job and start connecting with candidates actively building their
                careers on Resume Hub.
              </p>
              <Link href="/signup">
                <Button className="mt-5">Post Your First Job — Free</Button>
              </Link>
            </ScrollReveal>
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
