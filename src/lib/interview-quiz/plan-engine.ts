import type { QuizIndustry, QuizPainPoint, QuizTimeline } from "@/types/database";

export type QuizAnswers = {
  name?: string;
  urgency?: string;
  industry?: QuizIndustry;
  pain_point?: QuizPainPoint;
  experience_level?: string;
  format_pref?: string;
  timeline?: QuizTimeline;
};

const PAIN_POINT_COPY: Record<QuizPainPoint, string> = {
  freeze_up: "staying calm and confident under pressure",
  tricky_questions: "answering tricky questions confidently (weaknesses, gaps, salary)",
  rambling: "keeping your answers sharp and memorable",
  no_offers: "closing the gap between interviewing and getting the offer",
};

const PAIN_POINT_TIP: Record<QuizPainPoint, string> = {
  freeze_up: "Before you walk in, do a 60-second box-breathing round (4 in, 4 hold, 4 out, 4 hold) — it lowers your heart rate before the pressure spikes.",
  tricky_questions: "For \"what's your biggest weakness\", name a real one and follow it with the specific thing you're doing about it — that's the whole formula.",
  rambling: "Cap every answer at 90 seconds. If you're still talking, wrap the next sentence and stop — interviewers remember the last thing you said.",
  no_offers: "Ask at the end: \"Is there anything about my background that gives you pause?\" It surfaces objections you can address before you leave the room.",
};

const INDUSTRY_LABEL: Record<QuizIndustry, string> = {
  mining_engineering: "Mining & Engineering",
  corporate_finance: "Corporate / Finance / Admin",
  hr_recruitment: "HR / Recruitment / Operations",
  trades: "Trades / Technical",
  other: "your field",
};

const TIMELINE_COPY: Record<QuizTimeline, string> = {
  this_week: "your interview this week",
  two_weeks: "your interview in the next two weeks",
  this_month: "your interview within the month",
  early_prep: "when your next opportunity comes up",
};

export function buildPlanSummary(answers: QuizAnswers): string {
  const name = answers.name?.trim() || "there";
  const industry = answers.industry ? INDUSTRY_LABEL[answers.industry] : "your field";
  const painPoint = answers.pain_point ? PAIN_POINT_COPY[answers.pain_point] : "sharpening your interview skills";
  const timeline = answers.timeline ? TIMELINE_COPY[answers.timeline] : "your next interview";
  return `Based on your answers, ${name}, you're targeting ${industry} roles and want to focus on ${painPoint}. Your plan is built for ${timeline}.`;
}

export function painPointTip(painPoint: QuizPainPoint | null | undefined): string {
  return painPoint ? PAIN_POINT_TIP[painPoint] : PAIN_POINT_TIP.tricky_questions;
}

export function buildPlanVariant(answers: QuizAnswers): string {
  return [answers.industry ?? "other", answers.pain_point ?? "tricky_questions", answers.timeline ?? "early_prep"].join(
    "_"
  );
}

export type RoadmapStage = { day: string; title: string; detail: string };

const ROADMAP_STAGES: Record<QuizPainPoint, RoadmapStage[]> = {
  freeze_up: [
    { day: "Day 1–2", title: "Master your story", detail: "Elevator pitch, strengths, and a calm opening routine" },
    { day: "Day 3–4", title: "Pressure-proof practice", detail: "Breathing + pacing techniques rehearsed against real questions" },
    { day: "Day 5+", title: "Mock interview & final polish", detail: "Run through with feedback before the real thing" },
  ],
  tricky_questions: [
    { day: "Day 1–2", title: "Master your story", detail: "Elevator pitch, strengths/weaknesses framing" },
    { day: "Day 3–4", title: "Industry-specific Q&A prep", detail: "STAR-method answers built from your CV" },
    { day: "Day 5+", title: "Salary & gap-question drilling", detail: "Scripted answers for the questions people fear most" },
  ],
  rambling: [
    { day: "Day 1–2", title: "Tighten your story", detail: "Cut every answer to a clear, memorable structure" },
    { day: "Day 3–4", title: "STAR-method drilling", detail: "Practice concise, structured responses" },
    { day: "Day 5+", title: "Mock interview & final polish", detail: "Timed run-through with feedback" },
  ],
  no_offers: [
    { day: "Day 1–2", title: "Diagnose the gap", detail: "Review what's likely costing you the offer" },
    { day: "Day 3–4", title: "Closing-strength answers", detail: "Reframe weak spots, sharpen your close" },
    { day: "Day 5+", title: "Mock interview & final polish", detail: "Full run-through before your next interview" },
  ],
};

export function roadmapFor(painPoint: QuizPainPoint | null | undefined): RoadmapStage[] {
  return ROADMAP_STAGES[painPoint ?? "tricky_questions"];
}
