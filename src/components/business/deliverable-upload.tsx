"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { addDeliverable } from "@/lib/business/actions";

const MAX_BYTES = 50 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-100);
}

export function DeliverableUpload({ requestId, reference }: { requestId: string; reference: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("Files can be up to 50MB.");
      e.target.value = "";
      return;
    }
    setBusy(true);
    const path = `${reference}/${Date.now()}-${safeName(file.name)}`;
    const { error: uploadError } = await createClient().storage.from("studio-deliveries").upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
    } else {
      await addDeliverable(requestId, file.name, path);
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <div>
      <input ref={input} type="file" className="hidden" onChange={onChange} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        <Upload className="h-4 w-4" />
        {busy ? "Uploading…" : "Upload delivered file"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
