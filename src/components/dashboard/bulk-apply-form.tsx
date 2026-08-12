"use client";

import { useState, useTransition } from "react";
import { CircleCheck, Sparkles, Zap } from "lucide-react";
import { bulkApply } from "@/lib/applications/actions";
import { avatarColor } from "@/lib/avatar-color";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

const MAX_SELECTED = 5;

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  postedAt: string;
  matchScore: number | null;
};

function matchColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-slate-500";
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `R${Math.round(n / 1000)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

const BEFORE_SUBMITTING = [
  "Review your résumé is up to date",
  "Add a note to employers if you'd like one",
  "Confirm your contact details are current",
];

export function BulkApplyForm({ resumes, jobs }: { resumes: { id: string; title: string }[]; jobs: JobRow[] }) {
  const [resumeId, setResumeId] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ applied: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(jobId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else if (next.size < MAX_SELECTED) {
        next.add(jobId);
      }
      return next;
    });
  }

  function submit() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await bulkApply(resumeId, coverNote, Array.from(selected));
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
        setSelected(new Set());
      }
    });
  }

  if (resumes.length === 0) {
    return <p className="text-sm text-slate-500">Create a resume first.</p>;
  }

  const selectedJobs = jobs.filter((j) => selected.has(j.id));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Select jobs ({selected.size}/{MAX_SELECTED})
          </h2>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            No open roles available to bulk apply to right now.
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const isSelected = selected.has(job.id);
              const salary = formatSalary(job.salaryMin, job.salaryMax);
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => toggle(job.id)}
                  disabled={!isSelected && selected.size >= MAX_SELECTED}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                        isSelected ? "bg-brand-600" : avatarColor(job.company)
                      }`}
                    >
                      {isSelected ? <CircleCheck className="h-4 w-4" /> : job.company.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                        {salary ? ` · ${salary}` : ""}
                      </p>
                      <p className="text-[11px] text-slate-400">{daysAgo(job.postedAt)}</p>
                    </div>
                  </div>
                  {job.matchScore != null && (
                    <span className={`shrink-0 text-sm font-semibold ${matchColor(job.matchScore)}`}>
                      {job.matchScore}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Application summary</h2>
        <Card className="p-5">
          {selectedJobs.length === 0 ? (
            <div className="py-8 text-center">
              <Zap className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">Select jobs to see your application summary</p>
            </div>
          ) : (
            <div className="mb-4 space-y-2">
              {selectedJobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2 text-slate-700">{j.title}</span>
                  <span className="shrink-0 text-slate-400">{j.company}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Apply with</label>
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
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Note to employers (optional, sent to all selected)
              </label>
              <Textarea rows={3} value={coverNote} onChange={(e) => setCoverNote(e.target.value)} />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {result && (
            <p className="mt-3 text-sm text-emerald-600">
              Applied to {result.applied} job{result.applied === 1 ? "" : "s"}
              {result.skipped > 0 ? ` (${result.skipped} already applied, skipped)` : ""}.
            </p>
          )}

          <Button
            onClick={submit}
            disabled={isPending || selectedJobs.length === 0 || !resumeId}
            className="mt-4 w-full"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {isPending ? "Submitting…" : `Submit ${selectedJobs.length || ""} application${selectedJobs.length === 1 ? "" : "s"}`}
          </Button>

          <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Before submitting</p>
            {BEFORE_SUBMITTING.map((step) => (
              <p key={step} className="text-xs text-slate-500">
                · {step}
              </p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
