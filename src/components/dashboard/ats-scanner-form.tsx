"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
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

export function AtsScannerForm({ resumes }: { resumes: { id: string; title: string }[] }) {
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<(AiReview["feedback"] & { score?: number }) | null>(null);

  async function scan() {
    if (!resumeId) {
      setError("Choose a resume first.");
      return;
    }
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
    } catch {
      setError("Could not reach the scanner.");
    } finally {
      setLoading(false);
    }
  }

  if (resumes.length === 0) {
    return <p className="text-sm text-slate-500">Create a resume first.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Resume</label>
        <Select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
          <option value="">Select a resume</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Job description (optional)
        </label>
        <Textarea
          rows={6}
          placeholder="Paste a job description to tailor the scan"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={scan} disabled={loading}>
        {loading ? "Scanning…" : "Scan resume (1 credit)"}
      </Button>

      {review && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {typeof review.score === "number" && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-brand-600">{review.score}/100</span>
              <span className="text-sm text-slate-500">ATS match score</span>
            </div>
          )}
          {review.summary && <p className="text-sm text-slate-700">{review.summary}</p>}
          {typeof review.projected_score === "number" &&
            review.top_actions &&
            review.top_actions.length > 0 &&
            (review.score == null || review.projected_score > review.score) && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
                <p className="text-sm font-semibold text-brand-800">
                  📈 Do these to reach ~{review.projected_score}%
                </p>
                <ul className="mt-2 space-y-1.5">
                  {review.top_actions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        +{item.point_impact}
                      </span>
                      <span>{item.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
          {(
            [
              ["strengths", "Strengths", "text-emerald-700"],
              ["weaknesses", "Weaknesses", "text-amber-700"],
              ["suggestions", "Suggestions", "text-brand-700"],
              ["keyword_gaps", "Missing keywords", "text-red-700"],
            ] as const
          ).map(([key, label, tone]) => {
            const items = review[key];
            if (!items || items.length === 0) return null;
            return (
              <div key={key}>
                <p className={`text-sm font-semibold ${tone}`}>{label}</p>
                <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
