"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

type Category = "behavioural" | "technical" | "situational" | "culture_fit" | "motivation";
type Difficulty = "easy" | "medium" | "hard";
type Question = {
  id: string;
  category: Category;
  difficulty: Difficulty;
  question: string;
  answer: string;
  feedback: string | null;
  feedbackLoading: boolean;
};

const CATEGORY_LABELS: Record<Category, string> = {
  behavioural: "Behavioural",
  technical: "Technical",
  situational: "Situational",
  culture_fit: "Culture fit",
  motivation: "Motivation",
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const FILTERS: { value: "all" | Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "behavioural", label: "Behavioural" },
  { value: "technical", label: "Technical" },
  { value: "situational", label: "Situational" },
  { value: "culture_fit", label: "Culture Fit" },
  { value: "motivation", label: "Motivation" },
];

const TIPS = [
  "Answer in 90-120 seconds for most questions",
  "Use the STAR method for behavioural questions",
  "Review the AI feedback after each answer",
];

export default function MockInterviewPage() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | Category>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = questions?.filter((q) => q.feedback).length ?? 0;

  async function generate() {
    if (!role.trim()) {
      setError("Enter a role to practice for.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mock-interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setQuestions(
        (data.questions as Array<{ category: Category; difficulty: Difficulty; question: string }>).map(
          (q) => ({
            id: crypto.randomUUID(),
            ...q,
            answer: "",
            feedback: null,
            feedbackLoading: false,
          })
        )
      );
      setExpandedId(null);
      setActiveFilter("all");
    } catch {
      setError("Could not reach the interviewer.");
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(id: string, answer: string) {
    setQuestions((prev) => prev?.map((q) => (q.id === id ? { ...q, answer } : q)) ?? null);
  }

  async function getFeedback(q: Question) {
    if (!q.answer.trim()) return;
    setQuestions((prev) =>
      prev?.map((item) => (item.id === q.id ? { ...item, feedbackLoading: true } : item)) ?? null
    );
    try {
      const res = await fetch("/api/mock-interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, question: q.question, answer: q.answer }),
      });
      const data = await res.json();
      setQuestions((prev) =>
        prev?.map((item) =>
          item.id === q.id
            ? { ...item, feedbackLoading: false, feedback: res.ok ? data.feedback : null }
            : item
        ) ?? null
      );
    } catch {
      setQuestions((prev) =>
        prev?.map((item) => (item.id === q.id ? { ...item, feedbackLoading: false } : item)) ?? null
      );
    }
  }

  if (!questions) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Mock interview</h1>
        <p className="mb-6 text-sm text-slate-500">
          Get a set of real interview questions for a specific role, with instant AI feedback on
          your answers.
        </p>
        <Card className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Product Manager" />
            </div>
            <div>
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Generate questions (2 credits)"}
          </Button>
        </Card>
      </div>
    );
  }

  const filtered = questions.filter((q) => activeFilter === "all" || q.category === activeFilter);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mock interview</h1>
          <p className="text-sm text-slate-500">
            {role}
            {company ? ` at ${company}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setQuestions(null)}>
          New practice set
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActiveFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              activeFilter === f.value
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {filtered.map((q) => {
            const expanded = expandedId === q.id;
            return (
              <Card key={q.id} className="p-5">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : q.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {CATEGORY_LABELS[q.category]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_STYLES[q.difficulty]}`}
                      >
                        {q.difficulty}
                      </span>
                      {q.feedback && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                          Answered
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900">{q.question}</p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </button>

                {expanded && (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      rows={4}
                      value={q.answer}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      placeholder="Type your answer…"
                    />
                    <Button
                      size="sm"
                      onClick={() => getFeedback(q)}
                      disabled={q.feedbackLoading || !q.answer.trim()}
                    >
                      {q.feedbackLoading ? "Reviewing…" : "Get AI feedback"}
                    </Button>
                    {q.feedback && (
                      <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">{q.feedback}</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Your progress</h2>
            <p className="text-3xl font-bold text-slate-900">{answeredCount}</p>
            <p className="text-xs text-slate-500">questions answered</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand-600 transition-all"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {answeredCount} of {questions.length} done
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Tips</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
