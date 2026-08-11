"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import type { AiReview, ResumeScoreCategories } from "@/types/database";

const CATEGORY_LABELS: Record<keyof ResumeScoreCategories, string> = {
  ats_compatibility: "ATS Compatibility",
  keyword_coverage: "Keyword Coverage",
  summary_quality: "Summary Quality",
  experience_quality: "Experience Quality",
  achievement_quality: "Achievement Strength",
  skills_score: "Skills",
  formatting_score: "Formatting",
  completeness_score: "Completeness",
};

export function AiReviewPanel({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<AiReview["feedback"] & { score?: number } | null>(
    null
  );

  async function runReview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setReview(data);
      router.refresh();
    } catch {
      setError("Could not reach the AI review service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">AI resume review</h2>
        <p className="text-sm text-slate-500">
          Save your resume first, then get ATS scoring and feedback — optionally tailored to a job
          description.
        </p>
      </div>
      <Textarea
        rows={4}
        placeholder="Paste a job description to tailor the review (optional)"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />
      <Button type="button" onClick={runReview} disabled={loading} variant="secondary">
        {loading ? "Reviewing…" : "Run AI review"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {review && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {typeof review.score === "number" && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-brand-600">{review.score}/100</span>
              <span className="text-sm text-slate-500">ATS match score</span>
            </div>
          )}
          {review.summary && <p className="text-sm text-slate-700">{review.summary}</p>}
          {review.categories && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(CATEGORY_LABELS) as (keyof ResumeScoreCategories)[]).map((key) => (
                <div key={key} className="rounded-lg bg-white p-2.5 text-center">
                  <p className="text-lg font-bold text-slate-900">{review.categories![key]}%</p>
                  <p className="text-[11px] text-slate-500">{CATEGORY_LABELS[key]}</p>
                </div>
              ))}
            </div>
          )}
          <ReviewList title="Strengths" items={review.strengths} tone="text-emerald-700" />
          <ReviewList title="Weaknesses" items={review.weaknesses} tone="text-amber-700" />
          <ReviewList title="Suggestions" items={review.suggestions} tone="text-brand-700" />
          <ReviewList title="Missing keywords" items={review.keyword_gaps} tone="text-red-700" />
        </div>
      )}
    </Card>
  );
}

function ReviewList({
  title,
  items,
  tone,
}: {
  title: string;
  items?: string[];
  tone: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className={`text-sm font-semibold ${tone}`}>{title}</p>
      <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
