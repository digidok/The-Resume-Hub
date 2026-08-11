"use client";

import { useState, useTransition } from "react";
import { saveOfferDraft, sendOffer } from "@/lib/offers/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import type { OfferLetterStatus } from "@/types/database";

export function OfferLetterEditor({
  jobId,
  applicationId,
  initialContent,
  initialStatus,
}: {
  jobId: string;
  applicationId: string;
  initialContent: string;
  initialStatus: OfferLetterStatus | null;
}) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<OfferLetterStatus | null>(initialStatus);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/offer-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not draft offer letter.");
        return;
      }
      setContent(data.content);
    } catch {
      setError("Could not reach the AI service.");
    } finally {
      setGenerating(false);
    }
  }

  function saveDraft() {
    startTransition(async () => {
      await saveOfferDraft(jobId, applicationId, content);
    });
  }

  function send() {
    if (!confirm("Send this offer to the candidate? They'll be able to view it immediately.")) {
      return;
    }
    startTransition(async () => {
      await sendOffer(jobId, applicationId, content);
      setStatus("sent");
    });
  }

  return (
    <Card className="space-y-4 p-6">
      {status === "sent" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          This offer has been sent to the candidate.
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Offer letter</span>
        <Button type="button" size="sm" variant="outline" onClick={generate} disabled={generating}>
          {generating ? "Drafting…" : content ? "Regenerate with AI" : "Draft with AI"}
        </Button>
      </div>
      <Textarea rows={16} value={content} onChange={(e) => setContent(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={saveDraft} disabled={isPending || !content}>
          Save draft
        </Button>
        <Button type="button" onClick={send} disabled={isPending || !content}>
          Send to candidate
        </Button>
      </div>
    </Card>
  );
}
