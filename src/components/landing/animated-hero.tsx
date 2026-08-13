"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  HeartHandshake,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { EASE } from "@/components/motion/variants";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { ProductTour } from "@/components/landing/product-tour";

const JOB_COUNT_LABEL = "5,000+";

const TRUST_ITEMS = [
  `${JOB_COUNT_LABEL} live jobs`,
  "Help You Apply while you rest",
  "Verified employers & candidates",
  "Real human support",
];

const HERO_STATS = [
  { icon: Briefcase, value: 5000, suffix: "+", label: "Live jobs right now" },
  { icon: Clock, value: 5, suffix: "+ yrs", label: "Helping SA job seekers get hired" },
  { icon: ShieldCheck, value: 100, suffix: "%", label: "Verified employers & candidates" },
  { icon: HeartHandshake, value: 100, suffix: "%", label: "Real human support" },
];

const DRIFT_SHAPES = [
  {
    className: "absolute -right-24 top-10 h-80 w-80 rotate-12 border-2 border-brand-400/40",
    x: [0, 26, -8, 0],
    y: [0, -18, 12, 0],
    duration: 22,
  },
  {
    className: "absolute right-10 top-[42%] h-48 w-48 rotate-45 border-2 border-white/10",
    x: [0, -22, 10, 0],
    y: [0, 20, -14, 0],
    duration: 26,
  },
  {
    className: "absolute -left-14 bottom-6 h-52 w-52 -rotate-6 border-2 border-brand-600/50",
    x: [0, 18, -14, 0],
    y: [0, -14, 18, 0],
    duration: 24,
  },
  {
    className: "absolute left-1/3 top-10 h-20 w-20 rotate-45 border-2 border-slate-300",
    x: [0, 14, -10, 0],
    y: [0, 10, -8, 0],
    duration: 18,
  },
];

const BADGE_COLORS = {
  brand: "bg-brand-600 shadow-brand-950/40",
  accent: "bg-accent-500 shadow-accent-900/30",
  emerald: "bg-emerald-600 shadow-emerald-900/30",
};

const STATUS_BADGES = [
  {
    icon: FileCheck,
    text: "Offer letter ready",
    className: "absolute right-16 top-16 hidden lg:flex",
    color: "brand" as const,
    bobDelay: 0,
  },
  {
    icon: Send,
    text: "20 applications sent automatically",
    className: "absolute left-[53%] top-28 hidden lg:flex",
    color: "accent" as const,
    bobDelay: 0.3,
  },
  {
    icon: CheckCircle2,
    text: "Interview scheduled",
    className: "absolute right-4 top-[52%] hidden lg:flex",
    color: "brand" as const,
    bobDelay: 0.6,
  },
  {
    icon: FileText,
    text: "Unlimited Cover Letters",
    className: "absolute right-4 top-[70%] hidden lg:flex",
    color: "brand" as const,
    bobDelay: 0.9,
  },
  {
    icon: ShieldCheck,
    text: "Application verified",
    className: "absolute right-4 bottom-16 hidden lg:flex",
    color: "emerald" as const,
    bobDelay: 1.2,
  },
  {
    icon: FileCheck,
    text: "Unlimited CVs",
    className: "absolute left-[53%] bottom-28 hidden lg:flex",
    color: "brand" as const,
    bobDelay: 1.5,
  },
];

export function AnimatedHero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
    <section className="relative overflow-hidden bg-slate-100">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-brand-950 lg:block"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0f766e 1px, transparent 1px), linear-gradient(to bottom, #0f766e 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {DRIFT_SHAPES.map((shape, i) => (
          <motion.div
            key={i}
            className={shape.className}
            animate={prefersReducedMotion ? undefined : { x: shape.x, y: shape.y }}
            transition={{ duration: shape.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
        {STATUS_BADGES.map((badge) => (
          <motion.div
            key={badge.text}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: prefersReducedMotion ? 0 : [10, -8, 10],
              x: prefersReducedMotion ? 0 : [0, 10, -10, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: 0.9 + badge.bobDelay },
              scale: { duration: 0.5, delay: 0.9 + badge.bobDelay, ease: "backOut" },
              y: prefersReducedMotion
                ? { duration: 0.5, delay: 0.9 + badge.bobDelay }
                : { duration: 4, repeat: Infinity, ease: "easeInOut", delay: badge.bobDelay },
              x: prefersReducedMotion
                ? { duration: 0.5, delay: 0.9 + badge.bobDelay }
                : { duration: 6, repeat: Infinity, ease: "easeInOut", delay: badge.bobDelay },
            }}
            className={`${badge.className} items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white shadow-xl ring-2 ring-white ${BADGE_COLORS[badge.color]}`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/90" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <badge.icon className="h-4 w-4 shrink-0 text-white" />
            <span className="whitespace-nowrap">{badge.text}</span>
          </motion.div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand-600" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-28 pt-20 sm:pb-32 sm:pt-24 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {JOB_COUNT_LABEL} live jobs · Africa&apos;s first Help You Apply platform
          </motion.span>

          <h1 className="mx-auto mt-6 max-w-xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:mx-0">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="block"
            >
              We apply for jobs.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
              className="block text-brand-700"
            >
              You get on with life.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
            className="mx-auto mt-5 max-w-xl text-lg text-slate-600 lg:mx-0"
          >
            Browse {JOB_COUNT_LABEL} live jobs across South Africa, then let Help You
            Apply submit tailored applications on your behalf while you rest, work, or
            just get on with your day. Verified employers, verified candidates — one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
            className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Link href="/signup">
              <Button size="lg">Build My CV Free</Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline">
                Browse {JOB_COUNT_LABEL} Jobs
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.65 }}
            className="mt-5 flex justify-center lg:justify-start"
          >
            <ProductTour />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.8 }}
            className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 lg:justify-start"
          >
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand-700" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <DashboardPreview />
      </div>
    </section>

    <div className="relative z-10 mx-auto -mt-12 max-w-5xl px-4 sm:-mt-16">
      <ScrollReveal className="overflow-hidden rounded-md border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
        <div className="-mx-6 -mt-6 mb-6 h-1 bg-brand-600 sm:-mx-8 sm:-mt-8" />

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="mx-auto h-5 w-5 text-brand-700" />
              <p className="mt-2 text-2xl font-bold text-slate-900">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1.2} />
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
    </>
  );
}
