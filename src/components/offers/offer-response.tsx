"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { acceptOffer, declineOffer } from "@/lib/offers/actions";
import { Button } from "@/components/ui/button";
import type { OfferLetterStatus } from "@/types/database";

export function OfferResponse({
  offerId,
  applicationId,
  status,
}: {
  offerId: string;
  applicationId: string;
  status: OfferLetterStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function respond(accept: boolean) {
    setError(null);
    if (!accept && !confirm("Decline this offer? This can't be undone.")) return;
    startTransition(async () => {
      const res = accept
        ? await acceptOffer(offerId, applicationId)
        : await declineOffer(offerId, applicationId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCurrentStatus(accept ? "accepted" : "declined");
    });
  }

  if (currentStatus === "accepted") {
    return (
      <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-medium">You accepted this offer — congratulations!</p>
        <Link
          href={`/dashboard/applications/${applicationId}/induction`}
          className="mt-2 inline-block font-medium text-brand-700 hover:underline"
        >
          Start onboarding →
        </Link>
      </div>
    );
  }

  if (currentStatus === "declined") {
    return (
      <p className="mt-4 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
        You declined this offer.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => respond(true)} disabled={isPending}>
          Accept offer
        </Button>
        <Button variant="outline" onClick={() => respond(false)} disabled={isPending}>
          Decline
        </Button>
      </div>
    </div>
  );
}
