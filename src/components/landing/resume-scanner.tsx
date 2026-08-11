"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText, Check, ScanLine, RotateCcw } from "lucide-react";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { EASE } from "@/components/motion/variants";

type ScanStage = "idle" | "scanning" | "scored";

const CHECKS = ["Experience", "Skills", "Keywords", "Achievements"];
const LINE_WIDTHS = ["85%", "60%", "92%", "70%", "45%", "78%"];

export function ResumeScanner() {
  const [stage, setStage] = useState<ScanStage>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prefersReducedMotion = useReducedMotion();

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function runScan() {
    if (stage !== "idle") return;
    setStage("scanning");
    const scanDuration = prefersReducedMotion ? 200 : 1800;
    timers.current.push(setTimeout(() => setStage("scored"), scanDuration));
  }

  function reset() {
    clearTimers();
    setStage("idle");
  }

  return (
    <div
      onMouseEnter={runScan}
      onClick={stage === "idle" ? runScan : stage === "scored" ? reset : undefined}
      className="group relative mx-auto w-full max-w-sm cursor-pointer select-none overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 transition-shadow hover:shadow-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Interactive demo
        </p>
        {stage === "scored" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <RotateCcw className="h-3 w-3" /> Replay
          </button>
        )}
      </div>

      <div className="relative h-56 overflow-hidden rounded-xl bg-slate-50">
        {/* Document mock */}
        <div className="absolute inset-0 p-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-300" />
            <div className="h-2.5 w-24 rounded bg-slate-300" />
          </div>
          <div className="mt-4 space-y-2">
            {LINE_WIDTHS.map((w, i) => (
              <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Scan line */}
        {stage === "scanning" && (
          <div
            className="animate-scan-sweep absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_12px_2px_rgba(20,184,168,0.6)]"
            aria-hidden="true"
          />
        )}

        {/* Idle prompt */}
        <AnimatePresence>
          {stage === "idle" && (
            <motion.div
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 text-center backdrop-blur-sm"
            >
              <FileText className="h-7 w-7 text-brand-500" />
              <p className="text-sm font-medium text-slate-700">Drop your CV here</p>
              <p className="text-xs text-slate-400">Hover to see how Resume Hub reads it</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checklist + score */}
        <AnimatePresence>
          {stage !== "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-white via-white/95 to-transparent p-4"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {CHECKS.map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={stage === "scanning" || stage === "scored" ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.35, ease: EASE, delay: 0.3 + i * 0.28 }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    {label}
                  </motion.div>
                ))}
              </div>
              {stage === "scored" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2"
                >
                  <span className="text-xs font-semibold text-brand-800">CV Score</span>
                  <span className="text-lg font-bold text-brand-800">
                    <AnimatedCounter value={92} duration={0.7} />
                    /100
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
        <ScanLine className="h-3.5 w-3.5" />
        Visual preview — try it for real with your own CV, free.
      </div>
    </div>
  );
}
