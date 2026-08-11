"use client";

import { useState, useTransition } from "react";
import { bulkApply } from "@/lib/applications/actions";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

export function BulkApplyForm({
  resumes,
  jobs,
}: {
  resumes: { id: string; title: string }[];
  jobs: { id: string; title: string; company: string }[];
}) {
  const [resumeId, setResumeId] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ applied: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(jobId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
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

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Apply with</label>
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
            Note to employers (optional, sent to all selected)
          </label>
          <Textarea rows={3} value={coverNote} onChange={(e) => setCoverNote(e.target.value)} />
        </div>
      </Card>

      <div className="space-y-2">
        {jobs.map((job) => (
          <label
            key={job.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.has(job.id)}
              onChange={() => toggle(job.id)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{job.title}</p>
              <p className="text-xs text-slate-500">{job.company}</p>
            </div>
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-emerald-600">
          Applied to {result.applied} job{result.applied === 1 ? "" : "s"}
          {result.skipped > 0 ? ` (${result.skipped} already applied, skipped)` : ""}.
        </p>
      )}

      <Button onClick={submit} disabled={isPending || selected.size === 0 || !resumeId}>
        {isPending ? "Applying…" : `Apply to ${selected.size} job${selected.size === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}
