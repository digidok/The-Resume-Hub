"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { CvImportReview } from "@/components/resume/cv-import-review";
import { ACCEPTED_EXTENSIONS } from "@/lib/cv-import/detect";
import type { CvImportDraft } from "@/lib/cv-import/types";

const PROGRESS_STAGES = [
  "Uploading CV…",
  "Reading document…",
  "Analysing pages…",
  "Extracting experience…",
  "Building your Career Passport…",
];

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function extOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

type Stage = "form" | "loading" | "review" | "error";

export default function ImportProfilePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pickError, setPickError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [progressLabel, setProgressLabel] = useState(PROGRESS_STAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CvImportDraft | null>(null);
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleFilePick(picked: FileList | null) {
    setPickError(null);
    if (!picked || picked.length === 0) return;
    const list = Array.from(picked);

    if (list.length > 1) {
      const allImages = list.every((f) => IMAGE_EXTENSIONS.has(extOf(f)));
      if (!allImages) {
        setPickError("Multiple files must all be images — one photo per CV page.");
        setFiles([list[0]]);
        return;
      }
    }

    const unsupported = list.find((f) => !ACCEPTED_EXTENSIONS.includes(extOf(f)));
    if (unsupported) {
      setPickError(`"${unsupported.name}" isn't a supported file type.`);
      return;
    }

    setFiles(list);
    setText("");
  }

  async function submit() {
    if (!text.trim() && files.length === 0) {
      setPickError("Paste your profile text or choose a CV file.");
      return;
    }
    setStage("loading");
    setError(null);

    let stageIndex = 0;
    setProgressLabel(PROGRESS_STAGES[0]);
    timerRef.current = setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, PROGRESS_STAGES.length - 1);
      setProgressLabel(PROGRESS_STAGES[stageIndex]);
    }, 2200);

    try {
      const formData = new FormData();
      if (files.length > 0) {
        files.forEach((f) => formData.append("files", f));
      } else {
        formData.append("text", text.trim());
      }

      const res = await fetch("/api/import-profile", { method: "POST", body: formData });
      const data = await res.json();
      if (timerRef.current) clearInterval(timerRef.current);

      if (!res.ok) {
        setError(data.error ?? "We couldn't fully read this CV.");
        setStage("error");
        return;
      }

      setDraft(data.draft as CvImportDraft);
      setStage("review");
    } catch {
      if (timerRef.current) clearInterval(timerRef.current);
      setError("We couldn't reach the import service.");
      setStage("error");
    }
  }

  async function confirm(finalDraft: CvImportDraft) {
    setConfirming(true);
    try {
      const res = await fetch("/api/import-profile/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalDraft.content,
          careerExtras: finalDraft.careerExtras,
          sourceFilePath: finalDraft.sourceFiles[0]?.storagePath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "We couldn't save your CV.");
        setStage("error");
        return;
      }
      router.push(`/dashboard/resumes/${data.resumeId}`);
    } catch {
      setError("We couldn't reach the server.");
      setStage("error");
    } finally {
      setConfirming(false);
    }
  }

  function startOver() {
    setStage("form");
    setDraft(null);
    setFiles([]);
    setText("");
    setError(null);
  }

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
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Import your CV</h1>
      <p className="mb-6 text-sm text-slate-500">
        Upload your CV as a PDF, Word document, or photo/scan — including LinkedIn&apos;s PDF export
        (Profile → Resources → Save to PDF) — and we&apos;ll turn it into an editable Resume Hub CV.
        You&apos;ll get to review everything before it&apos;s saved.
      </p>
      <Card className="space-y-4 p-6">
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
    </div>
  );
}
