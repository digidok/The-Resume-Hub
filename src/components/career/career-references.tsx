"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { addReference, deleteReference, requestReference } from "@/lib/career-references/actions";
import type { CareerReference } from "@/types/database";

const STATUS_STYLES: Record<CareerReference["request_status"], string> = {
  not_requested: "bg-slate-100 text-slate-500",
  requested: "bg-amber-50 text-amber-700",
  received: "bg-emerald-50 text-emerald-700",
};

const STATUS_LABELS: Record<CareerReference["request_status"], string> = {
  not_requested: "Not requested",
  requested: "Requested",
  received: "Received",
};

const EMPTY_FORM = { name: "", relationship: "", company: "", email: "", phone: "" };

export function CareerReferences({ references }: { references: CareerReference[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setAdding(true);
    const result = await addReference(form);
    if (result.error) {
      setError(result.error);
    } else {
      setForm(EMPTY_FORM);
      router.refresh();
    }
    setAdding(false);
  }

  async function handleRequest(id: string) {
    setBusyId(id);
    setError(null);
    const result = await requestReference(id);
    if (result.error) setError(result.error);
    router.refresh();
    setBusyId(null);
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    await deleteReference(id);
    router.refresh();
    setBusyId(null);
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">References</h2>
        <p className="text-xs text-slate-500">
          South African employers commonly expect contactable references. Add them here, and
          optionally email a request for a short written reference.
        </p>
      </div>

      {references.length > 0 && (
        <div className="space-y-2">
          {references.map((ref) => (
            <div key={ref.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{ref.name}</p>
                  <p className="text-xs text-slate-500">
                    {[ref.relationship, ref.company].filter(Boolean).join(" · ")}
                  </p>
                  {(ref.email || ref.phone) && (
                    <p className="text-xs text-slate-400">
                      {[ref.email, ref.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ref.request_status]}`}
                  >
                    {STATUS_LABELS[ref.request_status]}
                  </span>
                  {ref.request_status === "not_requested" && ref.email && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === ref.id}
                      onClick={() => handleRequest(ref.id)}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId === ref.id}
                    onClick={() => handleDelete(ref.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {ref.reference_text && (
                <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  &ldquo;{ref.reference_text}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ref_name">Name</Label>
          <Input
            id="ref_name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="ref_relationship">Relationship</Label>
          <Input
            id="ref_relationship"
            placeholder="e.g. Direct Manager"
            value={form.relationship}
            onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="ref_company">Company</Label>
          <Input
            id="ref_company"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="ref_email">Email</Label>
          <Input
            id="ref_email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="ref_phone">Phone</Label>
          <Input
            id="ref_phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="button" variant="outline" size="sm" disabled={adding} onClick={handleAdd}>
        {adding ? "Adding…" : "Add reference"}
      </Button>
    </Card>
  );
}
