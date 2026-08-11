"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFollowUp } from "@/lib/followups/actions";
import type { AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

const initialState: AuthActionState = {};

export function CreateFollowUpForm({
  applications,
}: {
  applications: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createFollowUp, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  if (applications.length === 0) {
    return (
      <Card className="p-5 text-sm text-slate-500">
        Apply to a job first, then come back here to set a follow-up reminder.
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-sm font-semibold text-slate-900">Add a follow-up reminder</h2>
      <form ref={formRef} action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="application_id">Application</Label>
          <Select id="application_id" name="application_id" required defaultValue="">
            <option value="" disabled>
              Select an application
            </option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="due_date">Due date</Label>
            <Input id="due_date" name="due_date" type="date" required />
          </div>
        </div>
        <div>
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea id="note" name="note" rows={2} placeholder="e.g. Send a thank-you note" />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add follow-up"}
        </Button>
      </form>
    </Card>
  );
}
