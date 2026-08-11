"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveResume, renameResumeSlug } from "@/lib/resumes/actions";
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

export function ResumeEditor({ resume, siteUrl }: { resume: Resume; siteUrl: string }) {
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

  function update<K extends keyof ResumeContent>(key: K, value: ResumeContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  const hasGaps =
    !content.summary?.trim() ||
    content.skills.length === 0 ||
    content.experience.some((exp) => (exp.title || exp.company) && !exp.description?.trim());

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
        <SkillsEditor skills={content.skills} onChange={(skills) => update("skills", skills)} />
        <LanguagesEditor
          languages={content.languages}
          onChange={(languages) => update("languages", languages)}
        />

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
        {items.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
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

  return (
    <SectionCard title="Education" onAdd={add}>
      {items.length === 0 && <p className="text-sm text-slate-500">No education added yet.</p>}
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
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

  return (
    <SectionCard title="Projects" onAdd={add}>
      {items.length === 0 && <p className="text-sm text-slate-500">No projects added yet.</p>}
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
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
        ))}
      </div>
    </SectionCard>
  );
}

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addSkill() {
    const value = draft.trim();
    if (value && !skills.includes(value)) {
      onChange([...skills, value]);
    }
    setDraft("");
  }

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Add a skill and press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
          >
            {skill}
            <button
              type="button"
              onClick={() => onChange(skills.filter((s) => s !== skill))}
              className="text-brand-400 hover:text-brand-700"
              aria-label={`Remove ${skill}`}
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
