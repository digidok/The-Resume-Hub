"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  FileText,
  ListChecks,
  ScanSearch,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { EASE } from "@/components/motion/variants";

type TourStep = {
  icon: typeof FileText;
  title: string;
  description: string;
  targetId: string | null;
};

const STEPS: TourStep[] = [
  {
    icon: FileText,
    title: "Build your CV",
    description:
      "Upload an existing CV or build one from scratch with our AI-powered editor — live preview, multiple templates, one-click PDF export.",
    targetId: null,
  },
  {
    icon: ScanSearch,
    title: "AI CV analysis",
    description:
      "See exactly how Resume Hub reads your CV and scores it — ATS compatibility, keywords, achievements — before you ever apply.",
    targetId: null,
  },
  {
    icon: Target,
    title: "Job matching",
    description:
      "Every job gets a real, explainable match score based on your experience, skills and location — not just keyword stuffing.",
    targetId: "job-match",
  },
  {
    icon: Briefcase,
    title: "Application kit",
    description:
      "Generate a tailored CV, cover letter, recruiter message and interview prep for any role, together, in one click.",
    targetId: "application-kit",
  },
  {
    icon: ListChecks,
    title: "Track every application",
    description: "Follow each application from saved to hired in one dashboard — never lose track of an opportunity.",
    targetId: "pipeline",
  },
  {
    icon: Sparkles,
    title: "Your career coach",
    description: "Get straight answers about your CV, your search, and your next move — any time you need them.",
    targetId: "career-coach",
  },
];

const TOUR_SEEN_KEY = "resume-hub-tour-seen";

function goToSection(targetId: string | null) {
  if (!targetId) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(targetId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("tour-highlight");
  window.setTimeout(() => el.classList.remove("tour-highlight"), 1800);
}

export function ProductTour({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function launch() {
    setStepIndex(0);
    setOpen(true);
  }

  useEffect(() => {
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(TOUR_SEEN_KEY, "1");
      launch();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleViewSection() {
    goToSection(step.targetId);
    close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={launch}
        className={
          triggerClassName ??
          "inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
        }
      >
        Take a quick tour of our platform
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tour-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-black/20 outline-none"
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close tour"
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Step {stepIndex + 1} of {STEPS.length}
              </p>

              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <step.icon className="h-5 w-5" />
              </div>

              <h3 id="tour-title" className="mt-4 text-lg font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{step.description}</p>

              {step.targetId && (
                <button
                  type="button"
                  onClick={handleViewSection}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                >
                  View this on the page
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              <div className="mt-6 flex items-center justify-center gap-1.5">
                {STEPS.map((s, i) => (
                  <span
                    key={s.title}
                    className={`h-1.5 rounded-full transition-all ${
                      i === stepIndex ? "w-5 bg-brand-600" : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={close}
                  className="text-sm font-medium text-slate-400 hover:text-slate-600"
                >
                  Skip tour
                </button>
                <div className="flex gap-2">
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={() => setStepIndex((i) => i - 1)}
                      className="rounded-full border-2 border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (isLast ? close() : setStepIndex((i) => i + 1))}
                    className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 hover:bg-brand-600"
                  >
                    {isLast ? "Done" : "Next"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
