"use client";

import { useState, useTransition } from "react";
import { saveFollowUpDraft, markFollowUpSent } from "@/lib/followups/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";

export function FollowUpDraft({
  followUpId,
  initialSubject,
  initialBody,
  sent,
}: {
  followUpId: string;
  initialSubject: string | null;
  initialBody: string | null;
  sent: boolean;
}) {
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState(initialBody ?? "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasDraft = Boolean(subject || body);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/follow-ups/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not draft the email.");
        return;
      }
      setSubject(data.subject);
      setBody(data.body);
    } catch {
      setError("Could not reach the AI service.");
    } finally {
      setGenerating(false);
    }
  }

  function saveEdits() {
    startTransition(() => saveFollowUpDraft(followUpId, subject, body));
  }

  function copy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (sent) {
    return (
      <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Follow-up sent.
      </p>
    );
  }

  if (!hasDraft) {
    return (
      <div className="mt-3">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
          {generating ? "Drafting…" : "Draft follow-up email (1 credit)"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
      <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => markFollowUpSent(followUpId)}>
          Mark as sent
        </Button>
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button size="sm" variant="outline" onClick={saveEdits} disabled={isPending}>
          {isPending ? "Saving…" : "Save edits"}
        </Button>
        <Button size="sm" variant="ghost" onClick={generate} disabled={generating}>
          {generating ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>
    </div>
  );
}
