"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-100);
}

/**
 * Browser upload straight into a private bucket (admin policies allow it), then a
 * server action records the file. `register` is a bound server action.
 */
export function FileUpload({
  bucket,
  folder,
  label,
  maxMb = 50,
  register,
}: {
  bucket: string;
  folder: string;
  label: string;
  maxMb?: number;
  register: (name: string, path: string) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Files can be up to ${maxMb}MB.`);
      e.target.value = "";
      return;
    }
    setBusy(true);
    const path = `${folder}/${Date.now()}-${safeName(file.name)}`;
    const { error: uploadError } = await createClient().storage.from(bucket).upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
    } else {
      await register(file.name, path);
    }
    setBusy(false);
    e.target.value = "";
  }

  return (
    <div>
      <input ref={input} type="file" className="hidden" onChange={onChange} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        <Upload className="h-4 w-4" />
        {busy ? "Uploading…" : label}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
