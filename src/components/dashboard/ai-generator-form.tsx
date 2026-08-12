"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

export function AiGeneratorForm({
  jobs,
}: {
  jobs: { id: string; title: string; company: string }[];
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go() {
    if (!jobId) {
      setError("Choose a job to generate an application for.");
      return;
    }
    router.push(`/dashboard/applications/kit/${jobId}`);
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-slate-500">No open jobs to generate for right now.</p>;
  }

  return (
    <div className="space-y-4">
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
      <Button onClick={go}>Continue</Button>
    </div>
  );
}
