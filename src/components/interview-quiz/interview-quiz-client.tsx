"use client";

import { useEffect, useReducer, useState, type FormEvent } from "react";
import { QUIZ_QUESTIONS } from "@/lib/interview-quiz/questions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

const STORAGE_KEY = "rh_quiz_session";
const TOTAL_STEPS = QUIZ_QUESTIONS.length + 2; // + hook + contact capture

type QuizState = {
  sessionId: string;
  step: number;
  answers: Record<string, string>;
};

function initState(): QuizState {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as QuizState;
      } catch {
        // fall through to a fresh session
      }
    }
  }
  return { sessionId: crypto.randomUUID(), step: 0, answers: {} };
}

type Action = { type: "ANSWER"; id: string; value: string } | { type: "BACK" };

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case "ANSWER":
      return { ...state, answers: { ...state.answers, [action.id]: action.value }, step: state.step + 1 };
    case "BACK":
      return { ...state, step: Math.max(0, state.step - 1) };
    default:
      return state;
  }
}

export function InterviewQuizClient() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const progressPct = Math.round((state.step / TOTAL_STEPS) * 100);

  async function submitContact(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: state.sessionId,
          name: name.trim(),
          phone: phone.trim(),
          answers: state.answers,
          utm_source: new URLSearchParams(window.location.search).get("utm_source") || "direct",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.magicLink) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      window.localStorage.setItem(`${STORAGE_KEY}_name`, name.trim());
      window.location.href = data.magicLink;
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  // Step 0 — hook screen
  if (state.step === 0) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Land the job you applied for.</h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          Answer 6 quick questions and we&apos;ll build your personal interview prep plan — free.
        </p>
        <Button className="mt-6" onClick={() => dispatch({ type: "ANSWER", id: "_hook", value: "started" })}>
          Start my plan →
        </Button>
      </Card>
    );
  }

  // Steps 1..N — questions
  if (state.step <= QUIZ_QUESTIONS.length) {
    const question = QUIZ_QUESTIONS[state.step - 1];
    return (
      <Card className="mx-auto max-w-lg p-8">
        <ProgressBar pct={progressPct} />
        <h2 className="mt-4 text-xl font-bold text-slate-900">{question.question}</h2>
        <div className="mt-5 space-y-2.5">
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => dispatch({ type: "ANSWER", id: question.id, value: option.value })}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
            >
              {option.label}
            </button>
          ))}
        </div>
        {state.step > 1 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "BACK" })}
            className="mt-5 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            ← Back
          </button>
        )}
      </Card>
    );
  }

  // Final step — contact capture
  return (
    <Card className="mx-auto max-w-lg p-8">
      <ProgressBar pct={progressPct} />
      <h2 className="mt-4 text-xl font-bold text-slate-900">Almost there — where should we send your plan?</h2>
      <form onSubmit={submitContact} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="quiz-name">What should we call you?</Label>
          <Input id="quiz-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Thabo" />
        </div>
        <div>
          <Label htmlFor="quiz-phone">WhatsApp number to send your plan to</Label>
          <Input
            id="quiz-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+27 82 123 4567"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Building your plan…" : "Show me my plan →"}
        </Button>
      </form>
    </Card>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
