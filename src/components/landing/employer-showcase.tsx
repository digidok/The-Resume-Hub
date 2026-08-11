"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Sparkles, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { EASE } from "@/components/motion/variants";

const EMPLOYER_BENEFITS = [
  {
    icon: Target,
    title: "Reach active candidates",
    description: "Connect with job seekers who are actively applying.",
  },
  {
    icon: Sparkles,
    title: "AI matching scores",
    description: "Get detailed candidate match scores powered by AI.",
  },
  {
    icon: Clock,
    title: "Faster hiring",
    description: "Reduce time-to-hire with a streamlined pipeline.",
  },
  {
    icon: Users,
    title: "Quality candidates",
    description: "Access verified professionals building real CVs.",
  },
];

const MOCK_CANDIDATES = [
  { initials: "TN", title: "Senior Financial Analyst", match: 94 },
  { initials: "SD", title: "Project Manager", match: 89 },
  { initials: "PM", title: "Registered Nurse — ICU", match: 82 },
];

export function EmployerShowcase() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <ScrollReveal>
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          For Employers
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Reach job seekers{" "}
          <span className="text-brand-600">actively building their careers</span>
        </h2>
        <p className="mt-3 text-slate-600">
          Post your job openings and connect with candidates who are actively applying and
          improving their CVs on Resume Hub.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EMPLOYER_BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <benefit.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{benefit.title}</p>
                <p className="text-xs text-slate-500">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button>Post a Job</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Employer Dashboard</Button>
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.15} className="relative">
        <div className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-900/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Candidate matches
          </p>
          <div className="mt-3 space-y-2.5">
            {MOCK_CANDIDATES.map((candidate, i) => (
              <motion.div
                key={candidate.initials}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.2 + i * 0.15 }}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                    {candidate.initials}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{candidate.title}</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {candidate.match}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.7 }}
          className="absolute -right-3 -top-3 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-brand-600/25 sm:-right-5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI-ranked candidates
        </motion.div>
      </ScrollReveal>
    </div>
  );
}
