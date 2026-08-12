"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { submitReference } from "@/lib/career-references/actions";

export function ReferenceSubmitForm({ token }: { token: string }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await submitReference(token, text);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-emerald-700">
        Thank you — your reference has been submitted.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={8}
        placeholder="Share how you know this person, and your experience working with them…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="button" disabled={submitting} onClick={handleSubmit}>
        {submitting ? "Submitting…" : "Submit reference"}
      </Button>
    </div>
  );
}
