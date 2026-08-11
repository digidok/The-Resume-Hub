"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { EASE } from "@/components/motion/variants";

type Action = {
  label: string;
  question: string;
  response: string;
  highlight?: string;
};

const ACTIONS: Action[] = [
  {
    label: "Improve My CV",
    question: "How can I improve my CV?",
    response: "Add measurable results to your last two roles and tighten your summary to 3 lines.",
    highlight: "2 quick wins found",
  },
  {
    label: "Find Jobs",
    question: "What jobs should I be looking at?",
    response: "Based on your Career Passport, Senior HR roles in mining and manufacturing fit best.",
  },
  {
    label: "Why am I not getting interviews?",
    question: "Why am I applying for jobs but not getting interviews?",
    response: "Your experience is strong, but your CV is not showing enough measurable achievements.",
    highlight: "3 improvements recommended",
  },
  {
    label: "Prepare for Interview",
    question: "How do I prepare for my HR Manager interview?",
    response: "Practise 5 leadership-focused behavioural questions using the STAR method.",
  },
  {
    label: "Improve LinkedIn",
    question: "Can you help improve my LinkedIn profile?",
    response: "Your headline undersells your seniority — align it with your target role.",
  },
  {
    label: "Change Careers",
    question: "I want to move from HR into People Analytics — is that realistic?",
    response: "Yes — your data-driven HR projects already transfer well. Focus on 2 key skill gaps.",
  },
];

export function CareerCoachDemo() {
  const [active, setActive] = useState<Action>(ACTIONS[2]);

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
      <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-slate-900">Career Coach</p>
      </div>

      <div className="flex flex-wrap gap-2 px-6 pt-4">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => setActive(action)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active.label === action.label
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-3"
          >
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800">
              {active.question}
            </div>
            <div className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-brand-50 px-4 py-2.5 text-sm text-brand-900">
              {active.response}
            </div>
            {active.highlight && (
              <div className="ml-auto flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {active.highlight}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
