"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { addCareerDocument, deleteCareerDocument } from "@/lib/career-documents/actions";
import type { CareerDocument, CareerDocumentType } from "@/types/database";

const DOCUMENT_LABELS: Record<CareerDocumentType, string> = {
  id_copy: "ID copy",
  drivers_license: "Driver's licence",
  certificate: "Certified certificate",
  payslip: "Payslip",
  other: "Other document",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function CareerDocuments({ documents }: { documents: CareerDocument[] }) {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<CareerDocumentType>("id_copy");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(`"${file.name}" is too large. Please upload files under ${MAX_FILE_BYTES / (1024 * 1024)}MB.`);
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "document";
      const path = `${user.id}/${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("career-documents")
        .upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      const result = await addCareerDocument({
        documentType,
        storagePath: path,
        fileName: file.name,
        fileSize: file.size,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Document upload failed", err);
      setError("We couldn't upload that file. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteCareerDocument(id);
    router.refresh();
    setDeletingId(null);
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        <p className="text-xs text-slate-500">
          ID copy, driver&apos;s licence, certified certificates, and payslips — kept private and
          only shared with an employer if you&apos;ve consented to a background verification for
          their offer.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as CareerDocumentType)}
          className="max-w-[200px]"
        >
          {(Object.keys(DOCUMENT_LABELS) as CareerDocumentType[]).map((type) => (
            <option key={type} value={type}>
              {DOCUMENT_LABELS[type]}
            </option>
          ))}
        </Select>
        <label>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload file"}
          </span>
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {documents.length === 0 ? (
        <p className="text-sm text-slate-400">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{doc.file_name}</p>
                  <p className="text-xs text-slate-400">
                    {DOCUMENT_LABELS[doc.document_type]} · {formatSize(doc.file_size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deletingId === doc.id}
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
