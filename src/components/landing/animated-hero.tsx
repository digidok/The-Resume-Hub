"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE } from "@/components/motion/variants";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

const TRUST_ITEMS = [
  "AI-powered CV optimisation",
  "Real job matching",
  "Application tracking",
  "Human support",
];

export function AnimatedHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-700">
      {/* Ambient background: slow drifting light fields + faint grid. Transform/opacity only. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="animate-drift-a absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-brand-400/25 blur-3xl"
        />
        <div
          className="animate-drift-b absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl"
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-24 sm:py-28 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
            Your career. One platform.
          </motion.span>

          <h1 className="mx-auto mt-6 max-w-xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:mx-0">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="block"
            >
              Your next job
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
              className="block bg-gradient-to-r from-brand-200 via-white to-accent-300 bg-clip-text text-transparent"
            >
              starts here.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
            className="mx-auto mt-5 max-w-xl text-lg text-white/80 lg:mx-0"
          >
            Build a stronger CV, discover jobs that fit your experience, create better
            applications and manage your entire job search from one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
            className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Link href="/signup">
              <Button size="lg" variant="solidInverse">
                Build My CV Free
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outlineInverse">
                Explore Jobs
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70 lg:justify-start"
          >
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand-300" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
