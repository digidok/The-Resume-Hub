"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Bell,
  CalendarClock,
  ClipboardList,
  Search,
  Tags,
  X,
} from "lucide-react";
import { EASE } from "@/components/motion/variants";

type TourStep = {
  icon: typeof ClipboardList;
  title: string;
  description: string;
  action:
    | { type: "scroll"; targetId: string; label: string }
    | { type: "navigate"; href: string; label: string }
    | null;
};

const STEPS: TourStep[] = [
  {
    icon: ClipboardList,
    title: "Every application, tracked",
    description:
      "Everything you've applied to lives here, most recent first — with a running count of how many are interviewing or have turned into offers.",
    action: { type: "scroll", targetId: "applications-stats", label: "View this on the page" },
  },
  {
    icon: Tags,
    title: "What each status means",
    description:
      "An application moves through submitted → interviewing → offer → hired (or rejected) as things progress — the colour tells you where it stands at a glance.",
    action: { type: "scroll", targetId: "status-legend", label: "View this on the page" },
  },
  {
    icon: CalendarClock,
    title: "Interview dates show automatically",
    description:
      "Once an interview is scheduled, the date appears right on the application card — no separate calendar to check.",
    action: { type: "scroll", targetId: "applications-list", label: "View this on the page" },
  },
  {
    icon: Award,
    title: "Offers and onboarding",
    description:
      "Reach offer or hired status and a link appears on that card — review the offer letter, or start your onboarding module if you've accepted.",
    action: { type: "scroll", targetId: "applications-list", label: "View this on the page" },
  },
  {
    icon: Bell,
    title: "Never miss a follow-up",
    description:
      "Set a reminder to check in after an application or interview, and it'll flag itself here the moment it's due — including overdue ones.",
    action: { type: "navigate", href: "/dashboard/follow-ups", label: "Go to Follow-ups" },
  },
  {
    icon: Search,
    title: "Add more applications",
    description: "Browse open roles and apply straight from your Resume Hub CV — they'll show up here the moment you do.",
    action: { type: "navigate", href: "/jobs", label: "Browse open roles" },
  },
];

function highlightSection(targetId: string) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("tour-highlight");
  window.setTimeout(() => el.classList.remove("tour-highlight"), 1800);
}

export function ApplicationsTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

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

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleAction() {
    if (!step.action) return;
    if (step.action.type === "scroll") {
      highlightSection(step.action.targetId);
      close();
    } else {
      close();
      router.push(step.action.href);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={launch}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        Take a quick tour
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
              aria-labelledby="applications-tour-title"
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

              <h3 id="applications-tour-title" className="mt-4 text-lg font-bold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{step.description}</p>

              {step.action && (
                <button
                  type="button"
                  onClick={handleAction}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                >
                  {step.action.label}
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
