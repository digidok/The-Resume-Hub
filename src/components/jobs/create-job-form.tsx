"use client";

import { useActionState, useState } from "react";
import { createJob } from "@/lib/jobs/actions";
import type { AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

const initialState: AuthActionState = {};

export function CreateJobForm() {
  const [state, formAction, pending] = useActionState(createJob, initialState);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [description, setDescription] = useState("");
  const [assisting, setAssisting] = useState(false);
  const [assistError, setAssistError] = useState<string | null>(null);

  async function assistDescription() {
    setAssistError(null);
    if (!title.trim() || !company.trim()) {
      setAssistError("Enter a job title and company first.");
      return;
    }
    setAssisting(true);
    try {
      const res = await fetch("/api/jobs/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, employmentType, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAssistError(data.error ?? "Could not draft a description.");
        return;
      }
      setDescription(data.description);
    } catch {
      setAssistError("Could not reach the AI service.");
    } finally {
      setAssisting(false);
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Job title</Label>
            <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Remote, City, ..." />
          </div>
          <div>
            <Label htmlFor="employment_type">Employment type</Label>
            <Select
              id="employment_type"
              name="employment_type"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="salary_min">Salary min (optional)</Label>
            <Input id="salary_min" name="salary_min" type="number" min={0} />
          </div>
          <div>
            <Label htmlFor="salary_max">Salary max (optional)</Label>
            <Input id="salary_max" name="salary_max" type="number" min={0} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="description" className="mb-0">
              Description
            </Label>
            <Button type="button" size="sm" variant="outline" onClick={assistDescription} disabled={assisting}>
              {assisting ? "Writing…" : description ? "AI: Improve" : "AI: Write"}
            </Button>
          </div>
          <Textarea
            id="description"
            name="description"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {assistError && <p className="mt-1 text-sm text-red-600">{assistError}</p>}
        </div>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-900">Hiring contact (optional)</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Shown to candidates on the job listing so they know who they&apos;re applying to.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hiring_manager_name">Name</Label>
              <Input id="hiring_manager_name" name="hiring_manager_name" placeholder="Thandi Nkosi" />
            </div>
            <div>
              <Label htmlFor="hiring_manager_title">Title</Label>
              <Input id="hiring_manager_title" name="hiring_manager_title" placeholder="Talent Acquisition Lead" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="hiring_manager_email">Email</Label>
              <Input
                id="hiring_manager_email"
                name="hiring_manager_email"
                type="email"
                placeholder="hiring@company.com"
              />
            </div>
          </div>
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post job"}
        </Button>
      </form>
    </Card>
  );
}
