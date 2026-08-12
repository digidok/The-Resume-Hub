"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Target,
  Check,
  TriangleAlert,
  Sparkles,
  Pencil,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import {
  toggleChecklistItem,
  updateTailoredSummary,
  updateTailoredExperience,
  updateTailoredCoverLetter,
  submitGeneratedApplication,
} from "@/lib/ai-generations/actions";
import type { Job, JobMatch, ResumeContent } from "@/types/database";

type ResumeOption = { id: string; title: string; content: ResumeContent };

type Checklist = {
  resume_reviewed: boolean;
  cover_letter_reviewed: boolean;
  contact_confirmed: boolean;
  work_auth_confirmed: boolean;
  salary_confirmed: boolean;
  questions_done: boolean;
};

type GenerationResult = {
  generationId: string;
  tailoredResumeId: string;
  coverLetterId: string;
  matchedSkills: string[];
  skillsToAddress: string[];
  profileMatchPct: number | null;
  tailoredContent: ResumeContent;
  coverLetterContent: string;
};

const CHECKLIST_ITEMS: { field: keyof Checklist; label: string }[] = [
  { field: "resume_reviewed", label: "Resume reviewed" },
  { field: "cover_letter_reviewed", label: "Cover letter reviewed" },
  { field: "contact_confirmed", label: "Contact details confirmed" },
  { field: "work_auth_confirmed", label: "Work authorization confirmed" },
  { field: "salary_confirmed", label: "Salary expectations confirmed" },
  { field: "questions_done", label: "Application questions done" },
];

function norm(v: string) {
  return v.trim().toLowerCase();
}

function EditableText({
  value,
  multiline = true,
  onSave,
}: {
  value: string;
  multiline?: boolean;
  onSave: (next: string) => Promise<{ error?: string } | void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="group relative">
        <p className={multiline ? "whitespace-pre-line text-sm text-slate-700" : "text-sm text-slate-700"}>
          {value}
        </p>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          aria-label="Edit"
          className="absolute right-0 top-0 hidden h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 group-hover:flex"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={multiline ? 4 : 2} />
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await onSave(draft);
              setEditing(false);
            })
          }
        >
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function AiGeneratorPanel({
  job,
  resumes,
  initialMatch,
  creditsRemaining,
}: {
  job: Job;
  resumes: ResumeOption[];
  initialMatch: JobMatch | null;
  creditsRemaining: number;
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [checklist, setChecklist] = useState<Checklist>({
    resume_reviewed: false,
    cover_letter_reviewed: false,
    contact_confirmed: false,
    work_auth_confirmed: false,
    salary_confirmed: false,
    questions_done: false,
  });
  const [docTab, setDocTab] = useState<"resume" | "cover_letter">("resume");
  const [viewMode, setViewMode] = useState<"tailored" | "original" | "compare">("tailored");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selectedResume = resumes.find((r) => r.id === resumeId);

  const preSkills = job.skills.filter((s) =>
    (selectedResume?.content.skills ?? []).some((cs) => norm(cs) === norm(s))
  );
  const preGaps = job.skills.filter((s) => !preSkills.some((m) => norm(m) === norm(s)));

  const matchedSkills = generation?.matchedSkills ?? preSkills;
  const skillsToAddress = generation?.skillsToAddress ?? preGaps;
  const matchPct = generation?.profileMatchPct ?? initialMatch?.overallScore ?? null;

  async function runGeneration(regenerate: boolean) {
    if (!resumeId) return;
    if (regenerate && !confirm("This will use 1 more credit — continue?")) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-generate-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          jobId: job.id,
          generationId: regenerate ? generation?.generationId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate application.");
        return;
      }
      setGeneration({
        generationId: data.generationId,
        tailoredResumeId: data.tailoredResumeId,
        coverLetterId: data.coverLetterId,
        matchedSkills: data.matchedSkills,
        skillsToAddress: data.skillsToAddress,
        profileMatchPct: data.profileMatchPct,
        tailoredContent: data.tailoredContent,
        coverLetterContent: data.coverLetterContent,
      });
      setChecklist({
        resume_reviewed: false,
        cover_letter_reviewed: false,
        contact_confirmed: false,
        work_auth_confirmed: false,
        salary_confirmed: false,
        questions_done: false,
      });
      setDocTab("resume");
      setViewMode("tailored");
    } catch {
      setError("Could not reach the AI service.");
    } finally {
      setGenerating(false);
    }
  }

  function setChecked(field: keyof Checklist, value: boolean) {
    setChecklist((prev) => ({ ...prev, [field]: value }));
    if (generation) {
      startTransition(() => toggleChecklistItem(generation.generationId, field, value));
    }
  }

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const allChecked = checkedCount === CHECKLIST_ITEMS.length;

  async function handleSubmit() {
    if (!generation) return;
    setSubmitError(null);
    const result = await submitGeneratedApplication(generation.generationId);
    if (result?.error) setSubmitError(result.error);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      {/* Left panel */}
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              AI Application Generator
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                creditsRemaining < 1 ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"
              }`}
            >
              {creditsRemaining < 1 ? "Out of credits" : "1 AI credit will be used"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Review and approve every document before submitting — AI only uses information you&apos;ve
            provided.
          </p>

          <div className="mt-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
              {job.company.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
              <p className="truncate text-xs text-slate-500">
                {job.company}
                {job.location ? ` · ${job.location}` : ""}
              </p>
            </div>
          </div>

          {resumes.length > 1 && (
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-slate-700">Using resume</label>
              <Select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {matchPct != null && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Target className="h-3.5 w-3.5" /> {matchPct}% profile match
              </p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full ${
                    matchPct >= 90 ? "bg-emerald-500" : matchPct >= 70 ? "bg-brand-500" : "bg-slate-400"
                  }`}
                  style={{ width: `${matchPct}%` }}
                />
              </div>
            </div>
          )}

          {matchedSkills.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-700">Matched Skills</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {matchedSkills.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                  >
                    <Check className="h-3 w-3" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skillsToAddress.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <TriangleAlert className="h-3 w-3 text-amber-600" /> Skills to Address
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {skillsToAddress.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                  >
                    ~{s}
                  </span>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                These will be noted as growth areas in your cover letter.
              </p>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          <div className="mt-4">
            {!generation ? (
              <Button
                type="button"
                className="w-full"
                disabled={generating || !resumeId || creditsRemaining < 1}
                onClick={() => runGeneration(false)}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                {generating ? "Generating…" : "Generate Application"}
              </Button>
            ) : (
              <button
                type="button"
                disabled={generating || creditsRemaining < 1}
                onClick={() => runGeneration(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
            )}
          </div>
        </Card>

        {generation && (
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900">Review Checklist</p>
            <div className="mt-3 space-y-2.5">
              {CHECKLIST_ITEMS.map((item) => (
                <label key={item.field} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checklist[item.field]}
                    onChange={(e) => setChecked(item.field, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                {checkedCount} of {CHECKLIST_ITEMS.length} completed
              </span>
              <span>{Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100)}%</span>
            </div>
            <Button type="button" className="mt-4 w-full" disabled={!allChecked} onClick={handleSubmit}>
              Submit Application
            </Button>
            {!allChecked && (
              <p className="mt-1.5 text-center text-[11px] text-slate-400">
                Complete all checklist items to enable submission
              </p>
            )}
            {submitError && <p className="mt-2 text-center text-xs text-red-600">{submitError}</p>}
          </Card>
        )}
      </div>

      {/* Right panel */}
      <Card className="p-0">
        {!generation ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Ready to generate your application</p>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                AI will create a tailored resume and cover letter based on your profile and this job.
                You review everything before submitting.
              </p>
            </div>
            <Button
              type="button"
              disabled={generating || !resumeId || creditsRemaining < 1}
              onClick={() => runGeneration(false)}
            >
              {generating ? "Generating…" : "Generate Application"}
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex border-b border-slate-100">
              {(["resume", "cover_letter"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setDocTab(tab);
                    if (tab === "cover_letter") setViewMode("tailored");
                  }}
                  className={`flex-1 border-b-2 py-3 text-sm font-medium ${
                    docTab === tab
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "resume" ? "Tailored Resume" : "Cover Letter"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-2.5">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                {(docTab === "resume" ? (["tailored", "original", "compare"] as const) : (["tailored"] as const)).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-md px-2.5 py-1 capitalize ${
                        viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                      }`}
                    >
                      {mode}
                    </button>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/resumes/${generation.tailoredResumeId}`} target="_blank">
                  <Button type="button" size="sm" variant="outline">
                    <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                  </Button>
                </Link>
                <Link href={`/dashboard/resumes/${generation.tailoredResumeId}/print`} target="_blank">
                  <Button type="button" size="sm" variant="outline">
                    <Download className="mr-1 h-3.5 w-3.5" /> Export PDF
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-5">
              {docTab === "resume" ? (
                <ResumeDoc
                  tailored={generation.tailoredContent}
                  original={selectedResume?.content ?? generation.tailoredContent}
                  viewMode={viewMode}
                  tailoredResumeId={generation.tailoredResumeId}
                />
              ) : (
                <CoverLetterDoc
                  tailored={generation.coverLetterContent}
                  coverLetterId={generation.coverLetterId}
                  onUpdate={(content) => setGeneration((g) => (g ? { ...g, coverLetterContent: content } : g))}
                />
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ResumeDoc({
  tailored,
  original,
  viewMode,
  tailoredResumeId,
}: {
  tailored: ResumeContent;
  original: ResumeContent;
  viewMode: "tailored" | "original" | "compare";
  tailoredResumeId: string;
}) {
  const content = viewMode === "original" ? original : tailored;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">{content.full_name}</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        {[content.email, content.phone, content.location, content.website].filter(Boolean).join(" · ")}
      </p>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Professional Summary
      </p>
      {viewMode === "compare" ? (
        <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">Original</p>
            <p className="text-sm text-slate-500">{original.summary}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase text-brand-600">Tailored</p>
            <p className="text-sm text-slate-700">{tailored.summary}</p>
          </div>
        </div>
      ) : (
        <div className="mt-1.5">
          {viewMode === "tailored" ? (
            <EditableText value={content.summary ?? ""} onSave={(v) => updateTailoredSummary(tailoredResumeId, v)} />
          ) : (
            <p className="text-sm text-slate-700">{content.summary}</p>
          )}
        </div>
      )}

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Experience</p>
      <div className="mt-2 space-y-4">
        {(content.experience ?? []).map((exp, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-slate-900">{exp.title}</p>
            <p className="text-xs text-slate-500">
              {exp.company} · {exp.start_date} – {exp.current ? "Present" : exp.end_date}
            </p>
            {viewMode === "compare" ? (
              <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <p className="text-sm text-slate-500">{original.experience?.[i]?.description}</p>
                <p className="text-sm text-slate-700">{tailored.experience?.[i]?.description}</p>
              </div>
            ) : viewMode === "tailored" ? (
              <div className="mt-1">
                <EditableText
                  value={exp.description ?? ""}
                  onSave={(v) => updateTailoredExperience(tailoredResumeId, i, v)}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-700">{exp.description}</p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Skills</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {content.skills?.map((skill) => (
          <span key={skill} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function CoverLetterDoc({
  tailored,
  coverLetterId,
  onUpdate,
}: {
  tailored: string;
  coverLetterId: string;
  onUpdate: (content: string) => void;
}) {
  return (
    <EditableText
      value={tailored}
      onSave={async (v) => {
        await updateTailoredCoverLetter(coverLetterId, v);
        onUpdate(v);
      }}
    />
  );
}
