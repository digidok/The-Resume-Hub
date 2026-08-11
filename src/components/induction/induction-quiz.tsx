"use client";

import { useState } from "react";
import { submitInductionAttempt } from "@/lib/induction/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { InductionAttempt } from "@/types/database";

type Module = {
  module_id: string;
  title: string;
  content: string;
  pass_threshold: number;
  questions: { id: string; question: string; options: string[] }[];
};

export function InductionQuiz({
  applicationId,
  module,
  latestAttempt,
}: {
  applicationId: string;
  module: Module;
  latestAttempt: InductionAttempt | null;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correct: number;
    total: number;
  } | null>(null);
  const [retaking, setRetaking] = useState(false);

  const allAnswered = module.questions.every((q) => answers[q.id] !== undefined);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await submitInductionAttempt(applicationId, answers);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(res as { score: number; passed: boolean; correct: number; total: number });
  }

  const showResult = result ?? (latestAttempt && !retaking ? latestAttempt : null);

  if (showResult) {
    const passed = "passed" in showResult ? showResult.passed : false;
    const score = "score" in showResult ? showResult.score : 0;
    return (
      <Card className="space-y-4 p-6">
        <div
          className={`rounded-lg p-4 text-center ${passed ? "bg-emerald-50" : "bg-red-50"}`}
        >
          <p className={`text-3xl font-bold ${passed ? "text-emerald-700" : "text-red-700"}`}>
            {score}%
          </p>
          <p className={`mt-1 text-sm font-medium ${passed ? "text-emerald-700" : "text-red-700"}`}>
            {passed ? "You passed the induction quiz!" : `Not quite — you need ${module.pass_threshold}% to pass.`}
          </p>
        </div>
        {!passed && (
          <Button
            onClick={() => {
              setResult(null);
              setRetaking(true);
              setAnswers({});
            }}
          >
            Try again
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{module.title}</h2>
        <p className="whitespace-pre-line text-sm text-slate-700">{module.content}</p>
      </Card>

      <Card className="space-y-6 p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Quiz ({module.questions.length} question{module.questions.length === 1 ? "" : "s"}, need{" "}
          {module.pass_threshold}% to pass)
        </h2>
        {module.questions.map((q, qi) => (
          <div key={q.id}>
            <p className="mb-2 text-sm font-medium text-slate-900">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === oi}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                    className="h-4 w-4 text-brand-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={submit} disabled={!allAnswered || submitting}>
          {submitting ? "Submitting…" : "Submit quiz"}
        </Button>
      </Card>
    </div>
  );
}
