"use client";

import { useActionState } from "react";
import { createJob } from "@/lib/jobs/actions";
import type { AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

const initialState: AuthActionState = {};

export function CreateJobForm() {
  const [state, formAction, pending] = useActionState(createJob, initialState);

  return (
    <Card className="space-y-4 p-6">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Job title</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" required />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Remote, City, ..." />
          </div>
          <div>
            <Label htmlFor="employment_type">Employment type</Label>
            <Select id="employment_type" name="employment_type" defaultValue="full_time">
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
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={8} required />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post job"}
        </Button>
      </form>
    </Card>
  );
}
