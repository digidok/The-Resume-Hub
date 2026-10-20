"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { availableServices, type Division } from "@/lib/catalog/divisions";
import { whatsappLink } from "@/lib/whatsapp-contacts";

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export function EnquiryForm({ division, defaultService }: { division: Division; defaultService?: string }) {
  const services = availableServices(division);
  const [service, setService] = useState(defaultService ?? services[0]?.id ?? "");
  const [checks, setChecks] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const details: Record<string, string | string[]> = {};
    for (const f of division.extraFields ?? []) {
      details[f.name] = f.type === "checkboxes" ? (checks[f.name] ?? []) : String(data.get(`x_${f.name}`) ?? "");
    }
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division: division.slug,
          service,
          businessName: data.get("businessName"),
          contactName: data.get("contactName"),
          email: data.get("email"),
          phone: data.get("phone"),
          engagement: data.get("engagement"),
          turnaround: data.get("turnaround"),
          requirement: data.get("requirement"),
          consent: data.get("consent") === "on",
          marketing: data.get("marketing") === "on",
          website: data.get("website"),
          details,
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
        <h3 className="mt-3 text-xl font-bold text-slate-900">Enquiry received</h3>
        <p className="mt-2 text-sm text-slate-600">
          Your reference is <span className="font-semibold text-slate-900">{reference}</span>. We have emailed you an
          acknowledgement. For custom work you will receive a quotation to approve before any work starts.
        </p>
        <a
          href={whatsappLink("main", `Hi, I just submitted enquiry ${reference} for ${division.title}.`)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          <MessageCircle className="h-4 w-4" />
          Message us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="sm:col-span-2">
        <label className={labelCls} htmlFor="service">
          Service
        </label>
        <select id="service" value={service} onChange={(e) => setService(e.target.value)} className={inputCls}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {division.audience !== "individual" && (
        <div>
          <label className={labelCls} htmlFor="businessName">
            Business name
          </label>
          <input id="businessName" name="businessName" required maxLength={160} className={inputCls} />
        </div>
      )}
      <div>
        <label className={labelCls} htmlFor="contactName">
          {division.audience === "individual" ? "Your name" : "Contact person"}
        </label>
        <input id="contactName" name="contactName" required maxLength={120} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="email">
          {division.audience === "individual" ? "Email" : "Business email"}
        </label>
        <input id="email" name="email" type="email" required maxLength={200} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="phone">
          Telephone
        </label>
        <input id="phone" name="phone" type="tel" maxLength={40} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="engagement">
          Once-off or recurring
        </label>
        <select id="engagement" name="engagement" className={inputCls} defaultValue="once-off">
          <option value="once-off">Once-off</option>
          <option value="recurring">Recurring (monthly)</option>
        </select>
      </div>
      <div>
        <label className={labelCls} htmlFor="turnaround">
          Desired turnaround
        </label>
        <input id="turnaround" name="turnaround" maxLength={120} placeholder="e.g. within 5 working days" className={inputCls} />
      </div>

      {(division.extraFields ?? []).map((f) => (
        <div key={f.name} className={f.type === "textarea" || f.type === "checkboxes" ? "sm:col-span-2" : ""}>
          <label className={labelCls} htmlFor={`x_${f.name}`}>
            {f.label}
            {f.required ? " *" : ""}
          </label>
          {f.type === "select" ? (
            <select id={`x_${f.name}`} name={`x_${f.name}`} className={inputCls} defaultValue="">
              <option value="">Select…</option>
              {f.options?.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea id={`x_${f.name}`} name={`x_${f.name}`} rows={3} required={f.required} maxLength={1000} className={inputCls} />
          ) : f.type === "checkboxes" ? (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {f.options?.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={(checks[f.name] ?? []).includes(o)}
                    onChange={(e) =>
                      setChecks((prev) => {
                        const cur = prev[f.name] ?? [];
                        return { ...prev, [f.name]: e.target.checked ? [...cur, o] : cur.filter((v) => v !== o) };
                      })
                    }
                  />
                  {o}
                </label>
              ))}
            </div>
          ) : (
            <input id={`x_${f.name}`} name={`x_${f.name}`} maxLength={1000} className={inputCls} />
          )}
        </div>
      ))}

      <div className="sm:col-span-2">
        <label className={labelCls} htmlFor="requirement">
          What do you need?
        </label>
        <textarea id="requirement" name="requirement" required rows={4} maxLength={4000} className={inputCls} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>
            I agree that Resume Document Hub may use these details to respond to my enquiry, as set out in the{" "}
            <a href="/privacy" className="font-medium text-brand-600 underline">
              privacy policy
            </a>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-500">
          <input type="checkbox" name="marketing" className="mt-1" />
          <span>Optional: send me occasional updates about services. I can unsubscribe at any time.</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Sending…" : "Request a quote"}
        </Button>
      </div>
    </form>
  );
}
