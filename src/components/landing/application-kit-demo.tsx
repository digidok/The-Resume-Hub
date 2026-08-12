"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal, ScrollStagger } from "@/components/motion/scroll-reveal";
import { EASE, fadeUp } from "@/components/motion/variants";

const KIT_ITEMS = [
  "Tailored CV",
  "Cover Letter",
  "Recruiter Message",
  "Application Answers",
  "Interview Preparation",
];

export function ApplicationKitDemo() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
      <ScrollReveal className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Applying for</p>
        <h3 className="mt-2 text-xl font-bold text-white">Operations Manager</h3>
        <p className="text-sm text-white/60">Coastal Logistics · Durban</p>
        <div className="mt-6 space-y-2 text-sm text-white/70">
          <p>One click builds everything you need — tailored to this specific role.</p>
        </div>
      </ScrollReveal>

      <ScrollReveal
        delay={0.15}
        className="rounded-2xl border border-white/10 bg-white p-6 shadow-xl shadow-black/20"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Application kit
        </p>
        <ScrollStagger className="mt-4 space-y-3" staggerChildren={0.18}>
          {KIT_ITEMS.map((item) => (
            <motion.div
              key={item}
              variants={fadeUp}
              className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800"
            >
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              {item}
            </motion.div>
          ))}
        </ScrollStagger>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.18 * KIT_ITEMS.length + 0.2 }}
          className="mt-5 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5"
        >
          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-800">
            <CheckCircle2 className="h-4 w-4" />
            Application ready
          </span>
        </motion.div>

        <Link href="/signup">
          <Button className="mt-4 w-full justify-center">Apply Now</Button>
        </Link>
      </ScrollReveal>
    </div>
  );
}
