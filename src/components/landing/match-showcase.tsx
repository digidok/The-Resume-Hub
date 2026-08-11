"use client";

import { useState } from "react";
import { Check, X, Sparkles, PartyPopper, CalendarCheck } from "lucide-react";

const TABS = [
  { id: "match", label: "CV match score" },
  { id: "interview", label: "Interview scheduling" },
  { id: "offer", label: "Offer accepted" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const QUALIFICATIONS = [
  { label: "Advanced Excel & financial modelling", met: true },
  { label: "4+ years FP&A experience", met: true },
  { label: "CFA Level II candidate", met: true },
  { label: "M&A deal exposure", met: false },
];

function MatchCard() {
  return (
    <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-black/5 sm:grid-cols-2">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white">
            NL
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">Senior Financial Analyst</p>
            <p className="text-sm text-slate-500">Northwind Labs</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            R95k – R130k
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            Sandton, JHB
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            Senior
          </span>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</p>
        <p className="mt-1 text-sm text-slate-600">
          Build financial models and forecasts for the corporate division. Partner with leadership
          on strategic planning.
        </p>
      </div>
      <div className="bg-brand-50 p-6">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-800">
          <Sparkles className="h-4 w-4" />
          Why this is a good fit
        </div>
        <p className="mt-2 text-sm text-slate-700">
          Your modelling background and financial planning experience are a strong match for this
          role.
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Qualifications
        </p>
        <ul className="mt-2 space-y-1.5">
          {QUALIFICATIONS.map((q) => (
            <li key={q.label} className="flex items-start gap-2 text-sm text-slate-700">
              {q.met ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              {q.label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-800">89/100</span>
          <span className="text-sm font-medium text-emerald-700">Excellent fit</span>
        </div>
      </div>
    </div>
  );
}

function InterviewCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-accent-500 p-10 text-center text-white shadow-xl shadow-black/10">
      <div className="flex items-center justify-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
          JM
        </span>
        <CalendarCheck className="h-6 w-6 text-white/80" />
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sm font-bold text-brand-700">
          AR
        </span>
      </div>
      <h3 className="mt-5 text-2xl font-bold">It&apos;s an interview!</h3>
      <p className="mt-1 text-white/90">Acme Robotics wants to meet you.</p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
        Product Designer · Cape Town, ZA
      </span>
      <p className="mt-5 text-sm text-white/80">
        Thu, 14 Aug · 10:00 AM — a calendar invite and prep notes are waiting in your dashboard.
      </p>
    </div>
  );
}

function OfferCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-black/5">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <PartyPopper className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-2xl font-bold text-slate-900">Offer accepted 🎉</h3>
      <p className="mt-1 text-slate-600">
        Globex Software has sent your onboarding induction module — study the material and pass the
        quiz before your start date.
      </p>
      <div className="mx-auto mt-5 max-w-xs rounded-xl bg-slate-50 p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next step</p>
        <p className="mt-1 text-sm font-medium text-slate-800">Complete your induction module</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-2 w-2/3 rounded-full bg-brand-600" />
        </div>
        <p className="mt-1 text-xs text-slate-500">4 of 6 sections complete</p>
      </div>
    </div>
  );
}

export function MatchShowcase() {
  const [tab, setTab] = useState<TabId>("match");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mx-auto flex w-full max-w-md flex-wrap justify-center gap-8 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative pb-3 text-xs font-medium transition-colors sm:text-sm ${
              tab === t.id ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-400" />
            )}
          </button>
        ))}
      </div>
      <div key={tab} className="mt-8 animate-[fade-in_0.25s_ease]">
        {tab === "match" && <MatchCard />}
        {tab === "interview" && <InterviewCard />}
        {tab === "offer" && <OfferCard />}
      </div>
    </div>
  );
}
