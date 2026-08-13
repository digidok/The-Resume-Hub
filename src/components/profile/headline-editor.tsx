"use client";

import { useState, useTransition } from "react";
import { updateHeadline } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";

export function HeadlineEditor({ headline }: { headline: string | null }) {
  const [value, setValue] = useState(headline ?? "");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setStatus("idle");
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateHeadline(value);
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("saved");
      }
    });
  }

  return (
    <div>
      <p className="mb-1 text-sm text-slate-500">
        A short line under your name on your public profile, e.g. &ldquo;Software Engineer at
        Standard Bank&rdquo;.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          maxLength={120}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          placeholder="e.g. Marketing Graduate | Open to opportunities"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      {status === "saved" && <p className="mt-1 text-xs text-green-600">Saved.</p>}
      {status === "error" && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
    </div>
  );
}
