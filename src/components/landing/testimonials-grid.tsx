"use client";

import { useState } from "react";
import { Quote, ChevronDown } from "lucide-react";
import type { Testimonial } from "@/components/landing/testimonials";

const INITIAL_COUNT = 6;
const TRUNCATE_AT = 110;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = testimonial.quote.length > TRUNCATE_AT;
  const displayQuote =
    expanded || !isLong ? testimonial.quote : `${testimonial.quote.slice(0, TRUNCATE_AT).trimEnd()}…`;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Quote className="h-5 w-5 shrink-0 text-accent-400" />
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{displayQuote}&rdquo;</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex items-center gap-1 self-start text-xs font-medium text-brand-700 hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
          {initials(testimonial.name)}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
          <p className="text-xs text-slate-500">
            {testimonial.role} · {testimonial.location}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsGrid({ testimonials }: { testimonials: Testimonial[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? testimonials : testimonials.slice(0, INITIAL_COUNT);

  return (
    <div className="mx-auto mt-10 max-w-5xl px-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((testimonial) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} />
        ))}
      </div>
      {!showAll && testimonials.length > INITIAL_COUNT && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Show all {testimonials.length} testimonials
          </button>
        </div>
      )}
    </div>
  );
}
