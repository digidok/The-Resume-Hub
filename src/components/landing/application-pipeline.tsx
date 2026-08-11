"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { EASE } from "@/components/motion/variants";

const STAGES = ["Saved", "Matched", "Tailored", "Applied", "Shortlisted", "Interview", "Offer", "Hired"];

export function ApplicationPipeline() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-5xl overflow-x-auto pb-2">
      <div className="relative flex min-w-[720px] items-start justify-between px-2">
        <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200" aria-hidden="true">
          <motion.div
            className="h-0.5 bg-gradient-to-r from-brand-400 to-emerald-500"
            initial={{ width: "0%" }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 1.6, ease: EASE }}
          />
        </div>

        {STAGES.map((stage, i) => {
          const isLast = i === STAGES.length - 1;
          const delay = (prefersReducedMotion ? 0 : i * 0.15) + 0.1;
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, ease: EASE, delay }}
              className="relative z-10 flex w-20 flex-col items-center text-center"
            >
              <motion.span
                initial={{ scale: 0.8 }}
                whileInView={isLast ? { scale: [0.8, 1.15, 1] } : { scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: EASE, delay: delay + 0.1 }}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isLast
                    ? "bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(16,185,129,0.15)]"
                    : "bg-brand-600 text-white"
                }`}
              >
                {isLast ? <Check className="h-4 w-4" /> : i + 1}
              </motion.span>
              <span className={`mt-2 text-xs font-medium ${isLast ? "text-emerald-700" : "text-slate-600"}`}>
                {stage}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
