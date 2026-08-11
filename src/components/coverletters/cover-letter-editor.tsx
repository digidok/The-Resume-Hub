"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCoverLetter } from "@/lib/coverletters/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import type { CoverLetter } from "@/types/database";

export function CoverLetterEditor({ coverLetter }: { coverLetter: CoverLetter }) {
  const router = useRouter();
  const [title, setTitle] = useState(coverLetter.title);
  const [content, setContent] = useState(coverLetter.content);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveCoverLetter(coverLetter.id, { title, content });
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("Saved");
        router.refresh();
        setTimeout(() => setStatus(null), 2000);
      }
    });
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="cl-title" className="mb-0">
          Title
        </Label>
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      {status && <p className="text-sm text-emerald-600">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Input id="cl-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div>
        <Label htmlFor="cl-content">Content</Label>
        <Textarea
          id="cl-content"
          rows={20}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="font-serif"
        />
      </div>
    </Card>
  );
}
