"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, Clock, Loader2 } from "lucide-react";

type ApptType = { id: string; slug: string; name: string; description: string | null; duration_minutes: number };
type Slots = Record<string, string[]>;

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function sastParts(iso: string) {
  const local = new Date(new Date(iso).getTime() + 2 * 3600 * 1000);
  return {
    time: `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`,
  };
}

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    dow: dt.toLocaleDateString("en-ZA", { weekday: "short", timeZone: "UTC" }),
    day: d,
    month: dt.toLocaleDateString("en-ZA", { month: "short", timeZone: "UTC" }),
  };
}

export function BookingFlow({ types, initialType }: { types: ApptType[]; initialType?: string }) {
  const [typeSlug, setTypeSlug] = useState(types.find((t) => t.slug === initialType)?.slug ?? types[0]?.slug ?? "");
  const [slots, setSlots] = useState<Slots | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; when: string; manageUrl: string } | null>(null);

  const type = types.find((t) => t.slug === typeSlug);

  useEffect(() => {
    if (!typeSlug) return;
    let cancelled = false;
    fetch(`/api/appointments/slots?type=${encodeURIComponent(typeSlug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error ?? "Could not load available times.");
          return;
        }
        setSlots(data.slots);
        const first = Object.keys(data.slots).find((d) => data.slots[d].length > 0) ?? null;
        setDate(first);
      })
      .catch(() => !cancelled && setLoadError("Could not load available times."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [typeSlug]);

  function chooseType(slug: string) {
    if (slug === typeSlug) return;
    setSlots(null);
    setDate(null);
    setStart(null);
    setLoadError(null);
    setLoading(true);
    setTypeSlug(slug);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!start) {
      setError("Please choose a time.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeSlug,
          start,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          topic: form.get("topic"),
          notes: form.get("notes"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not book. Please try again.");
        if (res.status === 409) {
          // Refresh the list so the taken time disappears.
          setStart(null);
          const r = await fetch(`/api/appointments/slots?type=${encodeURIComponent(typeSlug)}`);
          if (r.ok) setSlots((await r.json()).slots);
        }
        return;
      }
      setDone(data);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">You&apos;re booked</h2>
        <p className="mt-2 text-slate-700">
          {type?.name} on <strong>{done.when}</strong>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Reference <strong>{done.reference}</strong>. We have emailed you a confirmation and a link to manage your appointment.
        </p>
        <Link href={done.manageUrl} className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Manage this appointment
        </Link>
      </div>
    );
  }

  const daysWithSlots = slots ? Object.keys(slots).filter((d) => slots[d].length > 0) : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">1. What would you like to book?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => chooseType(t.slug)}
              className={`rounded-xl border p-4 text-left transition ${
                t.slug === typeSlug ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-slate-200 bg-white hover:border-brand-300"
              }`}
            >
              <p className="font-semibold text-slate-900">{t.name}</p>
              {t.description && <p className="mt-1 text-xs text-slate-600">{t.description}</p>}
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-700">
                <Clock className="h-3.5 w-3.5" /> {t.duration_minutes} minutes
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">2. Pick a day and time (South African time)</h2>
        {loading && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading available times…
          </p>
        )}
        {loadError && <p className="mt-3 text-sm text-red-600">{loadError}</p>}
        {slots && daysWithSlots.length === 0 && (
          <p className="mt-3 text-sm text-slate-600">
            No times are open in the next three weeks. Please <Link href="/contact" className="font-medium text-brand-700 underline">contact us</Link> and we will arrange one.
          </p>
        )}
        {slots && daysWithSlots.length > 0 && (
          <>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {daysWithSlots.map((d) => {
                const l = dayLabel(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDate(d);
                      setStart(null);
                    }}
                    className={`flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2 ${
                      d === date ? "border-brand-600 bg-brand-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                    }`}
                  >
                    <span className="text-xs">{l.dow}</span>
                    <span className="text-lg font-bold leading-tight">{l.day}</span>
                    <span className="text-xs">{l.month}</span>
                  </button>
                );
              })}
            </div>
            {date && (
              <div className="mt-3 flex flex-wrap gap-2">
                {slots[date].map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setStart(iso)}
                    className={`rounded-md border px-3.5 py-2 text-sm font-medium ${
                      iso === start ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-brand-400"
                    }`}
                  >
                    {sastParts(iso).time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">3. Your details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" required maxLength={120} placeholder="Full name" className={inputCls} autoComplete="name" />
          <input name="email" type="email" required maxLength={200} placeholder="Email address" className={inputCls} autoComplete="email" />
          <input name="phone" maxLength={40} placeholder="Phone or WhatsApp (optional)" className={inputCls} autoComplete="tel" />
          <input name="topic" maxLength={200} placeholder="What would you like to discuss?" className={inputCls} />
          <textarea name="notes" rows={3} maxLength={1500} placeholder="Anything we should know beforehand? (optional)" className={`${inputCls} sm:col-span-2`} />
        </div>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>
            I agree that The Resume Document Hub may use my details to arrange this appointment, as set out in the{" "}
            <Link href="/privacy" className="text-brand-700 underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending || !start}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
          Confirm booking
        </button>
      </form>
    </div>
  );
}
