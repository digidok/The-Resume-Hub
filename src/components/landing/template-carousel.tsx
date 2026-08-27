"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResumePreview } from "@/components/resume/resume-preview";
import { Button } from "@/components/ui/button";
import type { ResumeContent } from "@/types/database";

const SAMPLE_CONTENT: ResumeContent = {
  full_name: "Thandiwe Mokoena",
  email: "thandiwe.mokoena@email.com",
  phone: "082 555 0134",
  location: "Sandton, Johannesburg",
  summary:
    "Results-driven marketing manager with 8+ years leading brand strategy and digital campaigns for consumer and B2B brands across South Africa.",
  experience: [
    {
      id: "exp-1",
      company: "Northwind Retail Group",
      title: "Senior Marketing Manager",
      location: "Johannesburg",
      start_date: "2021",
      current: true,
      description:
        "Lead a team of 6 driving brand strategy and digital campaigns, growing online revenue 42% year over year.",
    },
    {
      id: "exp-2",
      company: "Baobab Consumer Brands",
      title: "Marketing Manager",
      location: "Cape Town",
      start_date: "2018",
      end_date: "2021",
      description: "Managed a R12M annual marketing budget across TV, digital, and retail activation.",
    },
  ],
  education: [
    { id: "edu-1", school: "University of the Witwatersrand", degree: "BCom", field: "Marketing", start_date: "2012", end_date: "2015" },
  ],
  skills: ["Brand Strategy", "Digital Marketing", "Team Leadership", "Budget Management", "Campaign Analytics"],
  languages: ["English", "Zulu", "Afrikaans"],
  projects: [],
  certifications: ["Google Analytics Certified"],
  awards: [],
};

const FEATURED_TEMPLATE_IDS = [
  "professional",
  "sidebar-professional",
  "modern",
  "executive-portfolio",
  "bold-coral",
  "sidebar-charcoal",
  "classic-photo",
  "minimal",
];

const CARD_WIDTH = 240;
const PREVIEW_NATIVAL_WIDTH = 816; // 8.5in at 96dpi, matches ResumePreview's max-w-[8.5in]
const SCALE = CARD_WIDTH / PREVIEW_NATIVAL_WIDTH;

const AUTO_ADVANCE_MS = 4000;

export function TemplateCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion.current) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % FEATURED_TEMPLATE_IDS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  function go(delta: number) {
    setActive((i) => (i + delta + FEATURED_TEMPLATE_IDS.length) % FEATURED_TEMPLATE_IDS.length);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex gap-5 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(calc(50% - ${CARD_WIDTH / 2}px - ${active * (CARD_WIDTH + 20)}px))` }}
        >
          {FEATURED_TEMPLATE_IDS.map((templateId, i) => (
            <button
              key={templateId}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-xl border bg-white text-left shadow-sm transition-all duration-300 ${
                i === active
                  ? "scale-105 border-brand-400 shadow-lg shadow-brand-900/10"
                  : "scale-95 border-slate-200 opacity-60 hover:opacity-90"
              }`}
              style={{ width: CARD_WIDTH }}
            >
              <div
                className="overflow-hidden rounded-t-xl border-b border-slate-100 bg-slate-50"
                style={{ width: CARD_WIDTH, height: CARD_WIDTH * 1.29 }}
              >
                <div
                  style={{
                    width: PREVIEW_NATIVAL_WIDTH,
                    transform: `scale(${SCALE})`,
                    transformOrigin: "top left",
                  }}
                >
                  <ResumePreview content={SAMPLE_CONTENT} template={templateId} />
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {templateId
                    .split("-")
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous template"
        className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:text-brand-700 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next template"
        className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:text-brand-700 sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Link href="/signup">
          <Button>Use this template</Button>
        </Link>
        <Link href="/signup" className="text-sm font-medium text-brand-700 hover:underline">
          Show all 100+ templates →
        </Link>
      </div>
    </div>
  );
}
