"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

export default function ImportProfilePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim() && !file) {
      setError("Paste your profile text or choose a PDF file.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      else formData.append("text", text.trim());

      const res = await fetch("/api/import-profile", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/dashboard/resumes/${data.resumeId}`);
    } catch {
      setError("Could not reach the import service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">LinkedIn → CV</h1>
      <p className="mb-6 text-sm text-slate-500">
        LinkedIn doesn&apos;t let apps read profiles directly, so import by pasting your profile
        text or uploading LinkedIn&apos;s own PDF export (Profile → Resources → Save to PDF).
      </p>
      <Card className="space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Upload PDF export</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              if (e.target.files?.[0]) setText("");
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700"
          />
        </div>
        <div className="text-center text-xs text-slate-400">— or —</div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Paste your profile text
          </label>
          <Textarea
            rows={10}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value) setFile(null);
            }}
            placeholder="Copy the text from your LinkedIn profile page and paste it here…"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={submit} disabled={loading}>
          {loading ? "Importing…" : "Import as new resume"}
        </Button>
      </Card>
    </div>
  );
}
