"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { CvImportReview } from "@/components/resume/cv-import-review";
import { useCvImportFlow } from "@/lib/cv-import/use-cv-import-flow";
import { createResume } from "@/lib/resumes/actions";

type WizardStep = "branch" | "upload" | "ats" | "reassurance";
type AtsAnswer = "recruiters" | "ats";

const STEP_ORDER: WizardStep[] = ["branch", "upload", "ats", "reassurance"];

function StepDots({ step, hasUpload }: { step: WizardStep; hasUpload: boolean }) {
  const steps = hasUpload ? STEP_ORDER : (["branch", "ats", "reassurance"] as WizardStep[]);
  const activeIndex = steps.indexOf(step);
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-2 w-2 rounded-full transition-colors ${
            i <= activeIndex ? "bg-brand-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function NewResumeWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startParam = searchParams.get("start");

  const [step, setStep] = useState<WizardStep>(startParam === "scratch" ? "ats" : "branch");
  const [willUpload, setWillUpload] = useState(startParam === "upload");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [atsAnswer, setAtsAnswer] = useState<AtsAnswer | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const importFlow = useCvImportFlow((id) => {
    setResumeId(id);
    setStep("ats");
  });

  async function finish() {
    if (resumeId) {
      router.push(`/dashboard/resumes/${resumeId}`);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const id = await createResume();
      router.push(`/dashboard/resumes/${id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create your resume.");
      setCreating(false);
    }
  }

  if (step === "branch") {
    return (
      <div className="mx-auto max-w-lg py-8 text-center">
        <StepDots step={step} hasUpload={willUpload} />
        <h1 className="text-2xl font-bold text-slate-900">
          Do you have an existing CV to use as a starting point?
        </h1>
        <div className="mt-8 space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              setWillUpload(true);
              setStep("upload");
            }}
          >
            Yes
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setWillUpload(false);
              setStep("ats");
            }}
          >
            No
          </Button>
        </div>
      </div>
    );
  }

  if (step === "upload") {
    if (importFlow.stage === "review" && importFlow.draft) {
      return (
        <div className="mx-auto max-w-5xl">
          <CvImportReview
            draft={importFlow.draft}
            onConfirm={importFlow.confirm}
            onStartOver={importFlow.startOver}
            confirming={importFlow.confirming}
          />
        </div>
      );
    }

    if (importFlow.stage === "error") {
      return (
        <div className="mx-auto max-w-3xl py-8">
          <Card className="space-y-4 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <div>
              <p className="text-lg font-semibold text-slate-900">We couldn&apos;t fully read this CV.</p>
              <p className="mt-1 text-sm text-slate-600">
                Try uploading a clearer PDF/image, or start with a blank CV instead.
              </p>
              {importFlow.error && <p className="mt-2 text-sm text-red-600">{importFlow.error}</p>}
            </div>
            <div className="flex justify-center gap-3">
              <Button type="button" onClick={importFlow.startOver}>
                Try again
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setWillUpload(false);
                  setStep("ats");
                }}
              >
                Start from scratch instead
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    if (importFlow.stage === "loading") {
      return (
        <div className="mx-auto max-w-3xl py-8">
          <StepDots step={step} hasUpload={willUpload} />
          <Card className="space-y-4 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            <p className="text-sm font-medium text-slate-700">{importFlow.progressLabel}</p>
            <p className="text-xs text-slate-400">This can take a little longer for scanned or multi-page CVs.</p>
          </Card>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-3xl py-8">
        <button
          type="button"
          onClick={() => setStep("branch")}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <StepDots step={step} hasUpload={willUpload} />
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-900">
          Great. Please upload it for a quick start.
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          PDF, Word document, or a photo/scan — including LinkedIn&apos;s PDF export.
        </p>
        <Card className="space-y-4 p-6">
          <div>
            <input
              type="file"
              accept=".pdf,.docx,.doc,image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => importFlow.handleFilePick(e.target.files)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
            {importFlow.files.length > 0 && (
              <p className="mt-1 text-xs text-slate-600">
                Selected: {importFlow.files.map((f) => f.name).join(", ")}
              </p>
            )}
          </div>
          <div className="text-center text-xs text-slate-400">— or —</div>
          <Textarea
            rows={8}
            value={importFlow.text}
            onChange={(e) => {
              importFlow.setText(e.target.value);
              if (e.target.value) importFlow.setFiles([]);
            }}
            placeholder="Paste your LinkedIn profile text here…"
          />
          {importFlow.pickError && <p className="text-sm text-red-600">{importFlow.pickError}</p>}
          <Button className="w-full" onClick={importFlow.submit}>
            Upload &amp; continue
          </Button>
          <p className="text-center text-xs text-slate-400">
            We never share your data with third parties or use it for AI model training.
          </p>
        </Card>
      </div>
    );
  }

  if (step === "ats") {
    return (
      <div className="mx-auto max-w-lg py-8 text-center">
        <StepDots step={step} hasUpload={willUpload} />
        <h1 className="text-2xl font-bold text-slate-900">
          Are you primarily concerned with impressing recruiters or passing ATS?
        </h1>
        <div className="mt-8 space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              setAtsAnswer("recruiters");
              setStep("reassurance");
            }}
          >
            Impress recruiters
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAtsAnswer("ats");
              setStep("reassurance");
            }}
          >
            Pass ATS
          </Button>
        </div>
      </div>
    );
  }

  // step === "reassurance"
  const isAts = atsAnswer === "ats";
  return (
    <div className="mx-auto max-w-lg py-8 text-center">
      <StepDots step={step} hasUpload={willUpload} />
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        {isAts ? <ScanSearch className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        {isAts ? "Good call — and we've got you covered." : "Good call — that's exactly the right focus."}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        {isAts
          ? "Every Resume Hub template is built on clean, ATS-readable formatting — no tables, columns, or graphics that trip up applicant tracking systems. Run the ATS Scanner any time from your dashboard to check a specific job posting."
          : "More than 100 templates, an AI review, and real career-coach feedback are built in — so once ATS gets your CV through, a recruiter still sees a resume built to be read, not just parsed."}
      </p>
      {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
      <Button className="mt-6 w-full" onClick={finish} disabled={creating}>
        {creating ? "Setting up your CV…" : "Next"}
      </Button>
    </div>
  );
}
