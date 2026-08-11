"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, ScrollStagger } from "@/components/motion/scroll-reveal";
import { fadeUp } from "@/components/motion/variants";

const SKILLS = ["Leadership", "Recruitment", "Labour Relations", "Talent Management"];
const FLOW = ["Career Passport", "CV", "Job Match", "Application", "Interview"];

export function CareerPassportPreview() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
      <ScrollReveal className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Career Passport
          </p>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            Target: Senior HR Manager
          </span>
        </div>
        <h3 className="mt-3 text-xl font-bold text-slate-900">HR Manager</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Experience</p>
            <p className="font-semibold text-slate-800">9 years</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Industry</p>
            <p className="font-semibold text-slate-800">Mining</p>
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SKILLS.map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Qualification</p>
        <p className="mt-1 text-sm text-slate-700">BCom Human Resources</p>
      </ScrollReveal>

      <div>
        <p className="mb-5 text-sm text-slate-500">
          Fill it in once — Resume Hub uses it everywhere.
        </p>
        <ScrollStagger className="space-y-0" staggerChildren={0.12}>
          {FLOW.map((step, i) => (
            <motion.div key={step} variants={fadeUp} className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-slate-800">{step}</span>
              </div>
              {i < FLOW.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 rotate-90 text-slate-300" />
              )}
            </motion.div>
          ))}
        </ScrollStagger>
      </div>
    </div>
  );
}
