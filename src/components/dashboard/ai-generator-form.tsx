"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

export function AiGeneratorForm({
  resumes,
  jobs,
}: {
  resumes: { id: string; title: string }[];
  jobs: { id: string; title: string; company: string }[];
}) {
  const router = useRouter();
  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!resumeId || !jobId) {
      setError("Choose a resume and a job.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/dashboard/cover-letters/${data.coverLetterId}`);
    } catch {
      setError("Could not reach the AI generator.");
    } finally {
      setLoading(false);
    }
  }

  if (resumes.length === 0) {
    return <p className="text-sm text-slate-500">Create a resume first.</p>;
  }
  if (jobs.length === 0) {
    return <p className="text-sm text-slate-500">No open jobs to generate for right now.</p>;
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Job</label>
        <Select value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Select a job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} at {j.company}
            </option>
          ))}
        </Select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={generate} disabled={loading}>
        {loading ? "Generating…" : "Generate tailored cover letter (2 credits)"}
      </Button>
    </div>
  );
}
