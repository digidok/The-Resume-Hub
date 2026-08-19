"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import {
  approveWhatsAppReview,
  rejectWhatsAppReview,
  requestWhatsAppChanges,
} from "@/lib/admin/whatsapp-review";

export function WhatsAppReviewActions({ reviewId }: { reviewId: string }) {
  const [mode, setMode] = useState<"idle" | "reject" | "changes">("idle");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await approveWhatsAppReview(reviewId);
      if (res.error) setError(res.error);
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res =
        mode === "reject"
          ? await rejectWhatsAppReview(reviewId, notes)
          : await requestWhatsAppChanges(reviewId, notes);
      if (res.error) {
        setError(res.error);
      } else {
        setMode("idle");
        setNotes("");
      }
    });
  }

  if (mode !== "idle") {
    return (
      <div className="space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            mode === "reject" ? "Why is this being rejected? (optional)" : "What needs to change?"
          }
          rows={2}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={submit} disabled={isPending}>
            {isPending ? "Sending…" : mode === "reject" ? "Confirm reject" : "Send back for changes"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setMode("idle")} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={approve} disabled={isPending}>
          {isPending ? "Approving…" : "Approve"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setMode("changes")} disabled={isPending}>
          Request changes
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setMode("reject")} disabled={isPending}>
          Reject
        </Button>
      </div>
    </div>
  );
}
