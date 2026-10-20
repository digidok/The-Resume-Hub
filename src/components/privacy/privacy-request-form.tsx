"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { value: "access", label: "Access the information you hold about me" },
  { value: "correction", label: "Correct my information" },
  { value: "deletion", label: "Delete my information" },
  { value: "marketing_opt_out", label: "Stop marketing communications" },
  { value: "complaint", label: "Make a privacy complaint" },
];
const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export function PrivacyRequestForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const d = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: d.get("type"),
          name: d.get("name"),
          email: d.get("email"),
          details: d.get("details"),
          website: d.get("website"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
      setReference(json.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-bold text-slate-900">Request received</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your reference is <span className="font-semibold text-slate-900">{reference}</span>. We have emailed you a
          confirmation and may ask you to confirm your identity.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="hidden" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className={labelCls} htmlFor="type">
          What would you like to do?
        </label>
        <select id="type" name="type" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            Choose a request
          </option>
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" required maxLength={120} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">
            Email you used with us
          </label>
          <input id="email" name="email" type="email" required maxLength={200} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="details">
          Details (optional)
        </label>
        <textarea id="details" name="details" rows={4} maxLength={3000} className={inputCls} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? "Sending…" : "Submit request"}
      </Button>
    </form>
  );
}
