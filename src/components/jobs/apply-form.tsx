"use client";

import { useActionState } from "react";
import { applyToJob } from "@/lib/applications/actions";
import type { AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";

const initialState: AuthActionState = {};

export function ApplyForm({
  jobId,
  resumes,
  alreadyApplied,
}: {
  jobId: string;
  resumes: { id: string; title: string }[];
  alreadyApplied: boolean;
}) {
  const [state, formAction, pending] = useActionState(applyToJob, initialState);

  if (alreadyApplied || state.message) {
    return (
      <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        {state.message ?? "You've already applied to this job."}
      </p>
    );
  }

  if (resumes.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        Create a resume before applying to this job.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="job_id" value={jobId} />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="resume_id">
          Apply with
        </label>
        <Select id="resume_id" name="resume_id" required defaultValue="">
          <option value="" disabled>
            Select a resume
          </option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cover_note">
          Note to employer (optional)
        </label>
        <Textarea id="cover_note" name="cover_note" rows={4} />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
