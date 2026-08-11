"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  recordInterviewNoteFile,
  getInterviewNoteDownloadUrl,
  deleteInterviewNoteFile,
} from "@/lib/interview-notes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { InterviewNoteFile } from "@/types/database";

export function InterviewNotesUploader({
  jobId,
  applicationId,
  files,
}: {
  jobId: string;
  applicationId: string;
  files: InterviewNoteFile[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const storagePath = `${applicationId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("interview-notes")
        .upload(storagePath, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const res = await recordInterviewNoteFile(jobId, applicationId, file.name, storagePath);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function download(storagePath: string) {
    const res = await getInterviewNoteDownloadUrl(storagePath);
    if (res.url) window.open(res.url, "_blank", "noreferrer");
  }

  async function remove(fileId: string, storagePath: string) {
    if (!confirm("Delete this file?")) return;
    await deleteInterviewNoteFile(jobId, applicationId, fileId, storagePath);
    router.refresh();
  }

  return (
    <Card className="space-y-3 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Interview notes</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload file"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {files.length === 0 ? (
        <p className="text-sm text-slate-500">No interview notes uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{f.file_name}</p>
                <p className="text-xs text-slate-400">
                  Uploaded {new Date(f.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => download(f.storage_path)}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => remove(f.id, f.storage_path)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
