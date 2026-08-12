"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { EASE } from "@/components/motion/variants";

const STATS = [
  { label: "Jobs Matched", value: 24 },
  { label: "Applications", value: 12 },
  { label: "Interviews", value: 2 },
];

export function DashboardPreview() {
  const prefersReducedMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [showToast, setShowToast] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 60, damping: 14 });
  const springY = useSpring(rawY, { stiffness: 60, damping: 14 });

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(true), prefersReducedMotion ? 0 : 2400);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(relX * 10);
    rawY.set(relY * 8);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto w-full max-w-sm"
    >
      <motion.div
        style={{ x: springX, y: springY }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative rounded-2xl bg-white p-5 shadow-2xl shadow-black/25"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">CV Score</p>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <AnimatedCounter value={92} duration={1.3} className="text-3xl font-bold text-slate-900" />
          <span className="text-sm text-slate-400">/100</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            initial={{ width: "0%" }}
            animate={{ width: "92%" }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.7 + i * 0.12 }}
              className="rounded-xl bg-slate-50 p-2.5 text-center"
            >
              <AnimatedCounter
                value={stat.value}
                duration={0.9}
                className="block text-lg font-bold text-slate-900"
              />
              <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 1.3 }}
          className="mt-4 rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recommended job
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <AnimatedCounter value={94} duration={1} delay={1.6} />% Match
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">Senior HR Manager</p>
          <p className="text-xs text-slate-500">Meridian Mining · Johannesburg</p>
          <span className="mt-3 inline-block rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
            View Job
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}
        className="absolute -right-4 -top-4 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-lg shadow-black/10 sm:-right-6"
      >
        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
        CV enhanced by AI
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={showToast ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.4, ease: EASE }}
        className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-black/20"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        Application sent to Meridian Mining
      </motion.div>
    </div>
  );
}
