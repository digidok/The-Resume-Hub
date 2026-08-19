"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { buildPlanSummary, roadmapFor } from "@/lib/interview-quiz/plan-engine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuizIndustry, QuizPainPoint, QuizTimeline } from "@/types/database";

const STORAGE_KEY = "rh_quiz_session";

type StoredAnswers = {
  urgency?: string;
  industry?: QuizIndustry;
  pain_point?: QuizPainPoint;
  experience_level?: string;
  format_pref?: string;
  timeline?: QuizTimeline;
};

const TIERS = [
  {
    id: "quick_prep",
    tier: "Quick Prep",
    price: 199,
    includes: ["WhatsApp 5-day tip sequence", "Common questions cheat sheet"],
  },
  {
    id: "full_prep_pack",
    tier: "Full Prep Pack",
    price: 399,
    includes: ["Full personalized prep document", "Industry-specific question bank", "WhatsApp 5-day sequence"],
    highlight: true,
  },
  {
    id: "prep_and_mock",
    tier: "Prep + Mock Interview",
    price: 699,
    includes: ["Everything in Full Prep Pack", "One WhatsApp mock interview run-through with feedback"],
  },
];

function readQuizState(): { name: string; answers: StoredAnswers; sessionId: string } {
  if (typeof window === "undefined") return { name: "there", answers: {}, sessionId: "" };
  const saved = window.localStorage.getItem(STORAGE_KEY);
  const storedName = window.localStorage.getItem(`${STORAGE_KEY}_name`);
  let answers: StoredAnswers = {};
  let sessionId = "";
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as { sessionId: string; answers: StoredAnswers };
      answers = parsed.answers ?? {};
      sessionId = parsed.sessionId ?? "";
    } catch {
      // no saved quiz state — reveal will fall back to generic copy
    }
  }
  return { name: storedName || "there", answers, sessionId };
}

export function PlanRevealClient() {
  const [screen, setScreen] = useState<"loading" | "reveal" | "offer">("loading");
  const [{ name, answers, sessionId }] = useState(readQuizState);

  useEffect(() => {
    const timer = setTimeout(() => setScreen("reveal"), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (screen === "loading") {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <Sparkles className="mx-auto h-8 w-8 animate-pulse text-brand-500" />
        <p className="mt-4 text-sm font-medium text-slate-600">Building your plan…</p>
      </Card>
    );
  }

  const roadmap = roadmapFor(answers.pain_point);
  const summary = buildPlanSummary({ name, ...answers });

  if (screen === "reveal") {
    return (
      <Card className="mx-auto max-w-xl p-8">
        <h1 className="text-xl font-bold text-slate-900">Your personal interview prep plan</h1>
        <p className="mt-2 text-sm text-slate-600">{summary}</p>
        <div className="mt-6 space-y-3">
          {roadmap.map((stage) => (
            <div key={stage.title} className="flex gap-3 rounded-xl border border-slate-100 p-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{stage.day}</p>
                <p className="text-sm font-medium text-slate-900">{stage.title}</p>
                <p className="text-xs text-slate-500">{stage.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-6 w-full" onClick={() => setScreen("offer")}>
          Get my prep pack →
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-center text-xl font-bold text-slate-900">Choose your prep pack</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TIERS.map((t) => (
          <Card
            key={t.id}
            className={`flex flex-col p-6 ${t.highlight ? "border-2 border-brand-500 shadow-lg" : ""}`}
          >
            {t.highlight && (
              <span className="mb-2 w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-slate-900">{t.tier}</h2>
            <p className="mt-1 text-3xl font-bold text-slate-900">R{t.price}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
              {t.includes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
            <form action="/api/payfast/interview-pack-checkout" method="POST" className="mt-5">
              <input type="hidden" name="package_id" value={t.id} />
              <input type="hidden" name="session_id" value={sessionId} />
              <Button type="submit" variant={t.highlight ? "primary" : "outline"} className="w-full">
                Choose {t.tier}
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
