"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { CvImportReview } from "@/components/resume/cv-import-review";
import { useCvImportFlow } from "@/lib/cv-import/use-cv-import-flow";

export default function ImportProfilePage() {
  const router = useRouter();
  const {
    text,
    setText,
    files,
    setFiles,
    pickError,
    stage,
    progressLabel,
    error,
    draft,
    confirming,
    handleFilePick,
    submit,
    confirm,
    startOver,
  } = useCvImportFlow((resumeId) => router.push(`/dashboard/resumes/${resumeId}`));

  if (stage === "review" && draft) {
    return (
      <div className="mx-auto max-w-5xl">
        <CvImportReview draft={draft} onConfirm={confirm} onStartOver={startOver} confirming={confirming} />
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="space-y-4 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <div>
            <p className="text-lg font-semibold text-slate-900">We couldn&apos;t fully read this CV.</p>
            <p className="mt-1 text-sm text-slate-600">
              We can still help. Try uploading a clearer PDF/image, or contact our Resume Specialists.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-center gap-3">
            <Button type="button" onClick={startOver}>
              Try Again
            </Button>
            <a href="mailto:info@resumehub.co.za">
              <Button type="button" variant="outline">
                Contact Support
              </Button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="space-y-4 p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm font-medium text-slate-700">{progressLabel}</p>
          <p className="text-xs text-slate-400">This can take a little longer for scanned or multi-page CVs.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Import your CV</h1>
      <p className="mb-6 text-sm text-slate-500">
        Upload your CV as a PDF, Word document, or photo/scan — including LinkedIn&apos;s PDF export
        (Profile → Resources → Save to PDF) — and we&apos;ll turn it into an editable Resume Hub CV.
        You&apos;ll get to review everything before it&apos;s saved.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-6 lg:col-span-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Upload CV file(s)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.doc,image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => handleFilePick(e.target.files)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
            <p className="mt-1 text-xs text-slate-400">
              PDF, DOCX, DOC, PNG, JPG or WEBP. Select multiple images if your CV is a photo of each
              page.
            </p>
            {files.length > 0 && (
              <p className="mt-1 text-xs text-slate-600">
                Selected: {files.map((f) => f.name).join(", ")}
              </p>
            )}
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
                if (e.target.value) setFiles([]);
              }}
              placeholder="Copy the text from your LinkedIn profile page and paste it here…"
            />
          </div>
          {pickError && <p className="text-sm text-red-600">{pickError}</p>}
          <Button onClick={submit}>Analyse my CV</Button>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-900">What happens next</p>
          <ol className="mt-3 space-y-3">
            {[
              "We read your CV and extract your experience, education, and skills.",
              "You review everything before anything is saved — nothing is written automatically.",
              "Confirm, and it becomes an editable Resume Hub CV you can tailor per job.",
            ].map((step, i) => (
              <li key={step} className="flex gap-2.5 text-sm text-slate-600">
                <span className="font-semibold text-brand-600">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
