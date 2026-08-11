"use client";

import { useState, useTransition } from "react";
import { runAutoApply } from "@/lib/autoapply/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

export function AutoApplyForm({ resumes }: { resumes: { id: string; title: string }[] }) {
  const [resumeId, setResumeId] = useState("");
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<{ matched: number; applied: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await runAutoApply({ resumeId, keywords, location });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    });
  }

  if (resumes.length === 0) {
    return <p className="text-sm text-slate-500">Create a resume first.</p>;
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <Label htmlFor="resume">Apply with</Label>
        <Select id="resume" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
          <option value="">Select a resume</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="React, frontend, TypeScript"
        />
      </div>
      <div>
        <Label htmlFor="location">Location contains (optional)</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-emerald-600">
          Found {result.matched} matching job{result.matched === 1 ? "" : "s"}, applied to{" "}
          {result.applied}.
        </p>
      )}
      <Button onClick={run} disabled={isPending || !resumeId}>
        {isPending ? "Running…" : "Run auto-apply (1 credit)"}
      </Button>
      <p className="text-xs text-slate-400">
        Only matches open jobs posted on Resume Hub — this does not apply on other job boards.
      </p>
    </Card>
  );
}
