"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { updatePhoneNumber, setWhatsAppOptIn } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";

export function WhatsAppSettings({
  phoneNumber,
  whatsappOptIn,
}: {
  phoneNumber: string | null;
  whatsappOptIn: boolean;
}) {
  const [value, setValue] = useState(phoneNumber ?? "");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSavePhone() {
    setStatus("idle");
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updatePhoneNumber(value);
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("saved");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-sm text-slate-500">
          Add your WhatsApp number to apply for jobs and get status updates over WhatsApp — no
          data-heavy site needed.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="tel"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setStatus("idle");
            }}
            placeholder="e.g. 082 345 6789"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <Button type="button" size="sm" onClick={handleSavePhone} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        {status === "saved" && <p className="mt-1 text-xs text-green-600">Saved.</p>}
        {status === "error" && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
      </div>

      {phoneNumber && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
          <div className="flex items-start gap-2">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">WhatsApp status updates</p>
              <p className="text-xs text-slate-500">
                Get a WhatsApp message when your application status changes or auto-apply finds new
                matches.
              </p>
            </div>
          </div>
          <form action={setWhatsAppOptIn.bind(null, !whatsappOptIn)}>
            <Button type="submit" variant={whatsappOptIn ? "outline" : "primary"} size="sm">
              {whatsappOptIn ? "Turn off" : "Turn on"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
