"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { createCandidate } from "@/lib/admin/actions";

export function AddCandidateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Add candidate
      </Button>
    );
  }

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Add a candidate manually</h2>
      <form
        action={(formData: FormData) => {
          setError(null);
          startTransition(async () => {
            const result = await createCandidate({
              full_name: String(formData.get("full_name") ?? ""),
              email: String(formData.get("email") ?? ""),
              phone_number: String(formData.get("phone_number") ?? ""),
            });
            if (result.error) {
              setError(result.error);
              return;
            }
            setOpen(false);
            router.refresh();
          });
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div>
          <Label htmlFor="add_full_name">Full name</Label>
          <Input id="add_full_name" name="full_name" required />
        </div>
        <div>
          <Label htmlFor="add_email">Email</Label>
          <Input id="add_email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="add_phone">Phone (optional)</Label>
          <Input id="add_phone" name="phone_number" />
        </div>
        <div className="flex items-end gap-2 sm:col-span-3">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Creating…" : "Create candidate"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
      </form>
    </Card>
  );
}
