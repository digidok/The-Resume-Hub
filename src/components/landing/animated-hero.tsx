"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock, FileText, HeartHandshake, LayoutTemplate, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { EASE } from "@/components/motion/variants";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { ProductTour } from "@/components/landing/product-tour";

const TRUST_ITEMS = [
  "AI-powered CV optimisation",
  "Real job matching",
  "Application tracking",
  "Human support",
];

const HERO_STATS = [
  { icon: Clock, value: 5, suffix: "+ yrs", label: "Writing CVs professionally" },
  { icon: FileText, value: 66788, suffix: "+", label: "CVs written by our team" },
  { icon: LayoutTemplate, value: 10, suffix: "+", label: "Resume templates" },
  { icon: HeartHandshake, value: 100, suffix: "%", label: "Real human support" },
];

export function AnimatedHero() {
  return (
    <>
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      {/* Ambient background: slow drifting light fields + faint grid. Transform/opacity only. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-drift-a absolute -left-32 top-0 h-[34rem] w-[34rem] rounded-full bg-brand-300/50 blur-3xl" />
        <div className="animate-drift-b absolute -right-24 top-1/3 h-[30rem] w-[30rem] rounded-full bg-accent-300/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0f766e 1px, transparent 1px), linear-gradient(to bottom, #0f766e 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-28 pt-20 sm:pb-32 sm:pt-24 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Africa&apos;s first scheduled auto-apply platform
          </motion.span>

          <h1 className="mx-auto mt-6 max-w-xl text-5xl font-bold leading-[1.05] tracking-tighter sm:text-6xl lg:mx-0 lg:text-7xl">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="block text-slate-900"
            >
              Your next job
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
              className="block bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent"
            >
              starts here.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
            className="mx-auto mt-5 max-w-xl text-lg text-slate-600 lg:mx-0"
          >
            Build a stronger CV, discover jobs that fit your experience, create better
            applications and manage your entire job search from one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
            className="relative mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <div
              className="pointer-events-none absolute -inset-x-6 -inset-y-4 -z-10 rounded-full bg-brand-400/25 blur-2xl"
              aria-hidden="true"
            />
            <Link href="/signup">
              <Button size="lg">Build My CV Free</Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline">
                Browse Jobs
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
            className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start"
          >
            {TRUST_ITEMS.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-sm text-slate-600 shadow-sm backdrop-blur-sm"
              >
                <Check className="h-3.5 w-3.5 text-brand-500" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <DashboardPreview />
      </div>
    </section>

    <div className="relative z-10 mx-auto -mt-12 max-w-5xl px-4 sm:-mt-16">
      <ScrollReveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-brand-50/50 p-6 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5 sm:p-8">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-20 w-2/3 -translate-x-1/2 rounded-full bg-brand-400/30 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="mx-auto h-5 w-5 text-brand-500" />
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
