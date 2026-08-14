"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestInvoice } from "@/lib/invoices/actions";
import { Button } from "@/components/ui/button";

export function InvoiceRequestForm({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return (
      <p className="text-sm text-emerald-600">
        Invoice requested — we&apos;ll email it to your billing contact once it&apos;s issued.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        Prefer to pay by invoice/EFT?
      </button>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestInvoice({
        packageId,
        companyName: String(formData.get("company_name") ?? ""),
        contactPerson: String(formData.get("contact_person") ?? ""),
        billingEmail: String(formData.get("billing_email") ?? ""),
        vatNumber: String(formData.get("vat_number") ?? ""),
        billingAddress: String(formData.get("billing_address") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="mt-3 space-y-2.5 rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-900">Request an invoice</p>
      <p className="text-xs text-slate-500">
        We&apos;ll send an invoice to pay via EFT instead of an instant card charge.
      </p>
      <input
        name="company_name"
        required
        placeholder="Company name"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400"
      />
      <input
        name="contact_person"
        required
        placeholder="Contact person"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400"
      />
      <input
        name="billing_email"
        type="email"
        required
        placeholder="Billing email"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400"
      />
      <input
        name="vat_number"
        placeholder="VAT number (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400"
      />
      <input
        name="billing_address"
        placeholder="Billing address (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400"
      />
      <textarea
        name="notes"
        rows={2}
        placeholder="Notes for the invoice (optional)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Sending…" : "Request invoice"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
