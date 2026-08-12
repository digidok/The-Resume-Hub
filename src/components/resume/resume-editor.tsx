"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { saveResume, renameResumeSlug } from "@/lib/resumes/actions";
import { syncResumeToCareerPassport } from "@/lib/career/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { ResumePreview, RESUME_TEMPLATES } from "@/components/resume/resume-preview";
import { AiReviewPanel } from "@/components/resume/ai-review-panel";
import { PhotoUploader } from "@/components/resume/photo-uploader";
import { COMMON_LANGUAGES } from "@/lib/languages";
import type {
  Resume,
  ResumeContent,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
} from "@/types/database";

function newId() {
  return crypto.randomUUID();
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function ReorderButtons({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label="Move up"
        className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        aria-label="Move down"
        className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ResumeEditor({
  resume,
  siteUrl,
  initialJobDescription,
}: {
  resume: Resume;
  siteUrl: string;
  initialJobDescription?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(resume.title);
  const [template, setTemplate] = useState(resume.template);
  const [isPublic, setIsPublic] = useState(resume.is_public);
  const [slug, setSlug] = useState(resume.slug);
  const [content, setContent] = useState<ResumeContent>(resume.content);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fillGapsPending, setFillGapsPending] = useState(false);
  const [fillGapsStatus, setFillGapsStatus] = useState<string | null>(null);
  const [fillGapsError, setFillGapsError] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState(initialJobDescription ?? "");
  const [alignPending, setAlignPending] = useState(false);
  const [alignError, setAlignError] = useState<string | null>(null);
  const [alignResult, setAlignResult] = useState<{
    tailored_summary: string;
    suggested_skills: string[];
    keyword_gaps: string[];
  } | null>(null);
  const [selectedAlignSkills, setSelectedAlignSkills] = useState<string[]>([]);
  const [targetLanguage, setTargetLanguage] = useState("Arabic");
  const [translatePending, setTranslatePending] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSyncToCareerPassport() {
    setSyncPending(true);
    setSyncError(null);
    setSyncStatus(null);
    const result = await syncResumeToCareerPassport(content);
    if (result.error) {
      setSyncError(result.error);
    } else {
      const added = [
        result.addedSkills ? `${result.addedSkills} skill${result.addedSkills === 1 ? "" : "s"}` : null,
        result.addedLanguages
          ? `${result.addedLanguages} language${result.addedLanguages === 1 ? "" : "s"}`
          : null,
      ].filter(Boolean);
      setSyncStatus(
        added.length > 0
          ? `Added ${added.join(" and ")} to your Career Passport.`
          : "Your Career Passport is already up to date."
      );
    }
    setSyncPending(false);
  }

  function update<K extends keyof ResumeContent>(key: K, value: ResumeContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  const hasGaps =
    !content.summary?.trim() ||
    content.skills.length === 0 ||
    content.experience.some((exp) => (exp.title || exp.company) && !exp.description?.trim());

  const completenessChecks: { label: string; done: boolean }[] = [
    { label: "Full name", done: !!content.full_name?.trim() },
    { label: "Email or phone", done: !!(content.email?.trim() || content.phone?.trim()) },
    { label: "Summary", done: !!content.summary?.trim() },
    { label: "At least one work experience entry", done: content.experience.length > 0 },
    { label: "At least one education entry", done: content.education.length > 0 },
    { label: "At least 3 skills", done: content.skills.length >= 3 },
    {
      label: "Every experience entry has a description",
      done: content.experience.every((exp) => !!exp.description?.trim()),
    },
  ];
  const completenessScore = Math.round(
    (completenessChecks.filter((c) => c.done).length / completenessChecks.length) * 100
  );
  const missingChecks = completenessChecks.filter((c) => !c.done);

  async function handleFillGaps() {
    setFillGapsError(null);
    setFillGapsStatus(null);
    setFillGapsPending(true);
    try {
      const res = await fetch("/api/resume/fill-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFillGapsError(data.error || "Could not fill gaps.");
        return;
      }
      setContent((prev) => {
        const next = { ...prev };
        if (data.summary && !prev.summary?.trim()) next.summary = data.summary;
        if (data.skills?.length && prev.skills.length === 0) next.skills = data.skills;
        if (data.experience_descriptions?.length) {
          const byId = new Map<string, string>(
            data.experience_descriptions.map((d: { id: string; description: string }) => [d.id, d.description])
          );
          next.experience = prev.experience.map((exp) =>
            !exp.description?.trim() && byId.has(exp.id)
              ? { ...exp, description: byId.get(exp.id)! }
              : exp
          );
        }
        return next;
      });
      setFillGapsStatus("Gaps filled in — review the new content and save when ready.");
      setTimeout(() => setFillGapsStatus(null), 5000);
    } catch {
      setFillGapsError("Could not fill gaps. Please try again.");
    } finally {
      setFillGapsPending(false);
    }
  }

  async function handleAlignToJob() {
    if (!jobDescription.trim()) return;
    setAlignError(null);
    setAlignResult(null);
    setSelectedAlignSkills([]);
    setAlignPending(true);
    try {
      const res = await fetch("/api/resume/align-to-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlignError(data.error || "Could not align resume.");
        return;
      }
      setAlignResult(data);
    } catch {
      setAlignError("Could not align resume. Please try again.");
    } finally {
      setAlignPending(false);
    }
  }

  function toggleAlignSkill(skill: string) {
    setSelectedAlignSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function applyAlignedSummary() {
    if (!alignResult) return;
    update("summary", alignResult.tailored_summary);
  }

  function applySelectedAlignSkills() {
    if (selectedAlignSkills.length === 0) return;
    const merged = Array.from(new Set([...content.skills, ...selectedAlignSkills]));
    update("skills", merged);
    setSelectedAlignSkills([]);
  }

  async function handleTranslate() {
    setTranslateError(null);
    setTranslatePending(true);
    try {
      const res = await fetch("/api/resume/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id, targetLanguage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTranslateError(data.error || "Could not translate resume.");
        return;
      }
      router.push(`/dashboard/resumes/${data.resumeId}`);
    } catch {
      setTranslateError("Could not translate resume. Please try again.");
    } finally {
      setTranslatePending(false);
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveResume(resume.id, {
        title,
        template,
        is_public: isPublic,
        content,
      });
      if (result.error) {
        setError(result.error);
        setStatus(null);
      } else {
        setStatus("Saved");
        router.refresh();
        setTimeout(() => setStatus(null), 2000);
      }
    });
  }

  function handleSlugSave() {
    startTransition(async () => {
      const result = await renameResumeSlug(resume.id, slug);
      if (result.error) {
        setError(result.error);
      } else if (result.slug) {
        setSlug(result.slug);
        setError(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Resume settings</h2>
            <Button onClick={handleSave} disabled={isPending} size="sm">
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
          {status && <p className="text-sm text-emerald-600">{status}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-slate-700">Completeness</p>
              <p className="font-semibold text-slate-900">{completenessScore}%</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            {missingChecks.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {missingChecks.map((check) => (
                  <li key={check.label} className="text-xs text-slate-500">
                    · {check.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasGaps && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-700">
                  Missing a summary, skills, or role descriptions? Let AI fill in the gaps using what you&apos;ve
                  already added.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleFillGaps}
                  disabled={fillGapsPending}
                >
                  {fillGapsPending ? "Filling gaps…" : "Fill gaps with AI"}
                </Button>
              </div>
              {fillGapsStatus && <p className="mt-2 text-sm text-emerald-600">{fillGapsStatus}</p>}
              {fillGapsError && <p className="mt-2 text-sm text-red-600">{fillGapsError}</p>}
            </div>
          )}

          <div>
            <Label htmlFor="title">Resume title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="template">Template</Label>
            <Select id="template" value={template} onChange={(e) => setTemplate(e.target.value)}>
              {RESUME_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Public sharing</p>
              <p className="text-xs text-slate-500">Anyone with the link can view this resume.</p>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
          </div>

          <div>
            <Label htmlFor="slug">Share link</Label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                <span className="truncate">{siteUrl}/r/</span>
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleSlugSave} disabled={isPending}>
                Update
              </Button>
            </div>
            {isPublic && (
              <a
                href={`/r/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-brand-600 hover:underline"
              >
                View public page →
              </a>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <PhotoUploader
            userId={resume.user_id}
            photoUrl={content.photo_url}
            onChange={(url) => update("photo_url", url)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={content.full_name ?? ""}
                onChange={(e) => update("full_name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={content.email ?? ""}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={content.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={content.location ?? ""}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="website">Website / LinkedIn</Label>
              <Input
                id="website"
                value={content.website ?? ""}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              rows={4}
              value={content.summary ?? ""}
              onChange={(e) => update("summary", e.target.value)}
            />
          </div>

          <details className="rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              International CV details (optional)
            </summary>
            <p className="mt-2 text-xs text-slate-500">
              Common on CVs for the UAE, the wider Middle East, and Asia. Leave blank if you&apos;re
              applying mainly in South Africa.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={content.nationality ?? ""}
                  onChange={(e) => update("nationality", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="visa_status">Visa status</Label>
                <Input
                  id="visa_status"
                  placeholder="e.g. Employment visa"
                  value={content.visa_status ?? ""}
                  onChange={(e) => update("visa_status", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of birth</Label>
                <Input
                  id="date_of_birth"
                  placeholder="e.g. 12 Jan 1998"
                  value={content.date_of_birth ?? ""}
                  onChange={(e) => update("date_of_birth", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="marital_status">Marital status</Label>
                <Input
                  id="marital_status"
                  value={content.marital_status ?? ""}
                  onChange={(e) => update("marital_status", e.target.value)}
                />
              </div>
            </div>
          </details>
        </Card>

        <ExperienceEditor
          items={content.experience}
          onChange={(items) => update("experience", items)}
        />
        <EducationEditor
          items={content.education}
          onChange={(items) => update("education", items)}
        />
        <ProjectsEditor
          items={content.projects}
          onChange={(items) => update("projects", items)}
        />
        <TagsCard
          title="Skills"
          placeholder="Add a skill and press Enter"
          values={content.skills}
          onChange={(skills) => update("skills", skills)}
        />
        <LanguagesEditor
          languages={content.languages}
          onChange={(languages) => update("languages", languages)}
        />
        <TagsCard
          title="Certifications"
          placeholder="e.g. SAP SuccessFactors — press Enter"
          values={content.certifications}
          onChange={(certifications) => update("certifications", certifications)}
        />
        <TagsCard
          title="Awards & Honors"
          placeholder="e.g. Employee of the Year 2023 — press Enter"
          values={content.awards}
          onChange={(awards) => update("awards", awards)}
        />

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Align my CV to a job</h2>
            <p className="text-sm text-slate-500">
              Paste a job description and get a tailored summary and skill suggestions based on your
              real experience — nothing is applied automatically.
            </p>
          </div>
          <Textarea
            rows={5}
            placeholder="Paste the job description here…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={alignPending || !jobDescription.trim()}
            onClick={handleAlignToJob}
          >
            {alignPending ? "Aligning…" : "Align my CV"}
          </Button>
          {alignError && <p className="text-sm text-red-600">{alignError}</p>}

          {alignResult && (
            <div className="space-y-4 rounded-lg border border-slate-200 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tailored summary
                </p>
                <p className="mt-1 text-sm text-slate-700">{alignResult.tailored_summary}</p>
                <Button type="button" size="sm" variant="outline" className="mt-2" onClick={applyAlignedSummary}>
                  Use this summary
                </Button>
              </div>

              {alignResult.suggested_skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Skills worth adding
                  </p>
                  <div className="mt-2 space-y-1">
                    {alignResult.suggested_skills.map((skill) => (
                      <label key={skill} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                          checked={selectedAlignSkills.includes(skill)}
                          onChange={() => toggleAlignSkill(skill)}
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={selectedAlignSkills.length === 0}
                    onClick={applySelectedAlignSkills}
                  >
                    Add selected skills
                  </Button>
                </div>
              )}

              {alignResult.keyword_gaps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Missing from your resume
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {alignResult.keyword_gaps.map((gap) => (
                      <span
                        key={gap}
                        className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sync to Career Passport</h2>
            <p className="text-sm text-slate-500">
              Add this resume&apos;s skills and languages to your Career Passport. Never
              overwrites anything you&apos;ve already added there.
            </p>
          </div>
          <Button type="button" variant="outline" disabled={syncPending} onClick={handleSyncToCareerPassport}>
            {syncPending ? "Syncing…" : "Sync to Career Passport"}
          </Button>
          {syncStatus && <p className="text-sm text-emerald-600">{syncStatus}</p>}
          {syncError && <p className="text-sm text-red-600">{syncError}</p>}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Translate this resume</h2>
            <p className="text-sm text-slate-500">
              Creates a new resume with your summary, skills, and experience translated — handy for
              applying across Africa, the Middle East, and Asia. Save any pending edits first.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-auto"
            >
              {["Arabic", "French", "Portuguese", "Swahili", "Mandarin Chinese", "Hindi", "Amharic", "Zulu"].map(
                (lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                )
              )}
            </Select>
            <Button type="button" variant="outline" disabled={translatePending} onClick={handleTranslate}>
              {translatePending ? "Translating…" : "Translate"}
            </Button>
          </div>
          {translateError && <p className="text-sm text-red-600">{translateError}</p>}
        </Card>

        <AiReviewPanel resumeId={resume.id} />
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
            Live preview
          </div>
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
            <ResumePreview content={content} template={template} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          + Add
        </Button>
      </div>
      {children}
    </Card>
  );
}

type DutySuggestion = {
  loading: boolean;
  duties: string[];
  selected: string[];
  error: string | null;
};

function ExperienceEditor({
  items,
  onChange,
}: {
  items: ResumeExperience[];
  onChange: (items: ResumeExperience[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<Record<string, DutySuggestion>>({});

  function add() {
    onChange([...items, { id: newId(), company: "", title: "" }]);
  }
  function update(id: string, patch: Partial<ResumeExperience>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }
  function move(index: number, direction: -1 | 1) {
    onChange(moveItem(items, index, direction));
  }

  async function suggestDuties(item: ResumeExperience) {
    setSuggestions((prev) => ({
      ...prev,
      [item.id]: { loading: true, duties: [], selected: [], error: null },
    }));
    try {
      const res = await fetch("/api/resume/suggest-duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title, company: item.company }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestions((prev) => ({
          ...prev,
          [item.id]: { loading: false, duties: [], selected: [], error: data.error || "Could not suggest duties." },
        }));
        return;
      }
      setSuggestions((prev) => ({
        ...prev,
        [item.id]: { loading: false, duties: data.duties, selected: [], error: null },
      }));
    } catch {
      setSuggestions((prev) => ({
        ...prev,
        [item.id]: { loading: false, duties: [], selected: [], error: "Could not suggest duties. Please try again." },
      }));
    }
  }

  function toggleDuty(itemId: string, duty: string) {
    setSuggestions((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const selected = current.selected.includes(duty)
        ? current.selected.filter((d) => d !== duty)
        : [...current.selected, duty];
      return { ...prev, [itemId]: { ...current, selected } };
    });
  }

  function insertDuties(item: ResumeExperience) {
    const current = suggestions[item.id];
    if (!current || current.selected.length === 0) return;
    const bulletText = current.selected.map((d) => `• ${d}`).join("\n");
    const merged = item.description?.trim() ? `${item.description}\n${bulletText}` : bulletText;
    update(item.id, { description: merged });
    setSuggestions((prev) => ({ ...prev, [item.id]: { loading: false, duties: [], selected: [], error: null } }));
  }

  return (
    <SectionCard title="Experience" onAdd={add}>
      {items.length === 0 && <p className="text-sm text-slate-500">No experience added yet.</p>}
      <div className="space-y-5">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2 rounded-lg border border-slate-200 p-3">
            <ReorderButtons index={index} count={items.length} onMove={(dir) => move(index, dir)} />
            <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Job title"
                value={item.title}
                onChange={(e) => update(item.id, { title: e.target.value })}
              />
              <Input
                placeholder="Company"
                value={item.company}
                onChange={(e) => update(item.id, { company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Start (e.g. Jan 2022)"
                value={item.start_date ?? ""}
                onChange={(e) => update(item.id, { start_date: e.target.value })}
              />
              <Input
                placeholder="End"
                value={item.end_date ?? ""}
                disabled={item.current}
                onChange={(e) => update(item.id, { end_date: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={item.current ?? false}
                  onChange={(e) => update(item.id, { current: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                Current
              </label>
            </div>
            <Input
              placeholder="Location"
              value={item.location ?? ""}
              onChange={(e) => update(item.id, { location: e.target.value })}
            />
            <Textarea
              placeholder="What did you do? Use bullet points."
              rows={3}
              value={item.description ?? ""}
              onChange={(e) => update(item.id, { description: e.target.value })}
            />

            <div className="rounded-lg border border-dashed border-slate-200 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">Stuck on what to write?</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!item.title || suggestions[item.id]?.loading}
                  onClick={() => suggestDuties(item)}
                >
                  {suggestions[item.id]?.loading ? "Thinking…" : "Suggest duties with AI"}
                </Button>
              </div>
              {suggestions[item.id]?.error && (
                <p className="mt-1 text-xs text-red-600">{suggestions[item.id]?.error}</p>
              )}
              {!!suggestions[item.id]?.duties.length && (
                <div className="mt-2 space-y-1">
                  {suggestions[item.id]!.duties.map((duty) => (
                    <label key={duty} className="flex items-start gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                        checked={suggestions[item.id]!.selected.includes(duty)}
                        onChange={() => toggleDuty(item.id, duty)}
                      />
                      {duty}
                    </label>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={suggestions[item.id]?.selected.length === 0}
                    onClick={() => insertDuties(item)}
                  >
                    Insert selected
                  </Button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function EducationEditor({
  items,
  onChange,
}: {
  items: ResumeEducation[];
  onChange: (items: ResumeEducation[]) => void;
}) {
  function add() {
    onChange([...items, { id: newId(), school: "" }]);
  }
  function update(id: string, patch: Partial<ResumeEducation>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }
  function move(index: number, direction: -1 | 1) {
    onChange(moveItem(items, index, direction));
  }

  return (
    <SectionCard title="Education" onAdd={add}>
      {items.length === 0 && <p className="text-sm text-slate-500">No education added yet.</p>}
      <div className="space-y-5">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2 rounded-lg border border-slate-200 p-3">
            <ReorderButtons index={index} count={items.length} onMove={(dir) => move(index, dir)} />
            <div className="flex-1 space-y-2">
            <Input
              placeholder="School"
              value={item.school}
              onChange={(e) => update(item.id, { school: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Degree"
                value={item.degree ?? ""}
                onChange={(e) => update(item.id, { degree: e.target.value })}
              />
              <Input
                placeholder="Field of study"
                value={item.field ?? ""}
                onChange={(e) => update(item.id, { field: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Start year"
                value={item.start_date ?? ""}
                onChange={(e) => update(item.id, { start_date: e.target.value })}
              />
              <Input
                placeholder="End year"
                value={item.end_date ?? ""}
                onChange={(e) => update(item.id, { end_date: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ProjectsEditor({
  items,
  onChange,
}: {
  items: ResumeProject[];
  onChange: (items: ResumeProject[]) => void;
}) {
  function add() {
    onChange([...items, { id: newId(), name: "" }]);
  }
  function update(id: string, patch: Partial<ResumeProject>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }
  function move(index: number, direction: -1 | 1) {
    onChange(moveItem(items, index, direction));
  }

  return (
    <SectionCard title="Projects" onAdd={add}>
      {items.length === 0 && <p className="text-sm text-slate-500">No projects added yet.</p>}
      <div className="space-y-5">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2 rounded-lg border border-slate-200 p-3">
            <ReorderButtons index={index} count={items.length} onMove={(dir) => move(index, dir)} />
            <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Project name"
                value={item.name}
                onChange={(e) => update(item.id, { name: e.target.value })}
              />
              <Input
                placeholder="URL (optional)"
                value={item.url ?? ""}
                onChange={(e) => update(item.id, { url: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Description"
              rows={2}
              value={item.description ?? ""}
              onChange={(e) => update(item.id, { description: e.target.value })}
            />
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function TagsCard({
  title,
  placeholder,
  values,
  onChange,
}: {
  title: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addValue() {
    const value = draft.trim();
    if (value && !values.includes(value)) {
      onChange([...values, value]);
    }
    setDraft("");
  }

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addValue}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="text-brand-400 hover:text-brand-700"
              aria-label={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </Card>
  );
}

function LanguagesEditor({
  languages,
  onChange,
}: {
  languages: string[];
  onChange: (languages: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const allSelected = COMMON_LANGUAGES.every((lang) => languages.includes(lang));

  function toggleLanguage(lang: string) {
    if (languages.includes(lang)) {
      onChange(languages.filter((l) => l !== lang));
    } else {
      onChange([...languages, lang]);
    }
  }

  function toggleAll() {
    if (allSelected) {
      onChange(languages.filter((l) => !(COMMON_LANGUAGES as readonly string[]).includes(l)));
    } else {
      const merged = new Set([...languages, ...COMMON_LANGUAGES]);
      onChange([...merged]);
    }
  }

  function addCustom() {
    const value = draft.trim();
    if (value && !languages.includes(value)) {
      onChange([...languages, value]);
    }
    setDraft("");
  }

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-lg font-semibold text-slate-900">Languages</h2>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-slate-300 text-brand-600"
        />
        Select all
      </label>
      <div className="flex flex-wrap gap-3">
        {COMMON_LANGUAGES.map((lang) => (
          <label key={lang} className="flex items-center gap-1.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={languages.includes(lang)}
              onChange={() => toggleLanguage(lang)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            {lang}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add another language and press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addCustom}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages
          .filter((lang) => !(COMMON_LANGUAGES as readonly string[]).includes(lang))
          .map((lang) => (
            <span
              key={lang}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
            >
              {lang}
              <button
                type="button"
                onClick={() => onChange(languages.filter((l) => l !== lang))}
                className="text-brand-400 hover:text-brand-700"
                aria-label={`Remove ${lang}`}
              >
                ×
              </button>
            </span>
          ))}
      </div>
    </Card>
  );
}
