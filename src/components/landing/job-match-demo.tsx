"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { EASE } from "@/components/motion/variants";

const SUB_SCORES = [
  { label: "Experience", value: 98 },
  { label: "Skills", value: 96 },
  { label: "Industry", value: 93 },
  { label: "Qualification", value: 91 },
  { label: "Location", value: 87 },
];

const STRENGTHS = ["Strong experience match", "Industry experience", "Leadership experience"];

export function JobMatchDemo() {
  return (
    <ScrollReveal className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Senior HR Manager
          </p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">ABC Mining</h3>
          <p className="text-sm text-slate-500">Johannesburg · Full-time</p>
        </div>
        <div className="flex flex-col items-center sm:items-end">
          <span className="text-4xl font-bold text-brand-700">
            <AnimatedCounter value={94} duration={1.2} />%
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Job match
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 px-6 py-6 sm:px-8">
        {SUB_SCORES.map((s, i) => (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>{s.label}</span>
              <AnimatedCounter value={s.value} duration={0.9} delay={0.15 * i} suffix="%" />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                initial={{ width: "0%" }}
                whileInView={{ width: `${s.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.15 * i }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-slate-100 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Why you match</p>
          <ul className="mt-2 space-y-1.5">
            {STRENGTHS.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Potential gap</p>
          <p className="mt-2 flex items-start gap-2 text-sm text-slate-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            SAP exposure
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
        <Link href="/signup">
          <Button>Tailor My CV</Button>
        </Link>
      </div>
    </ScrollReveal>
  );
}
