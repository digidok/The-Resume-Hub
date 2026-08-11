"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { TagListEditor } from "@/components/career/tag-list-editor";
import type { CvImportDraft } from "@/lib/cv-import/types";

function ConfidenceBadge({ score }: { score: number }) {
  const tone =
    score >= 85
      ? "bg-emerald-50 text-emerald-700"
      : score >= 60
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{score}% confidence</span>;
}

export function CvImportReview({
  draft: initialDraft,
  onConfirm,
  onStartOver,
  confirming,
}: {
  draft: CvImportDraft;
  onConfirm: (draft: CvImportDraft) => void;
  onStartOver: () => void;
  confirming: boolean;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [editing, setEditing] = useState(false);

  const { content, careerExtras, confidence, lowConfidenceFields, hasProfilePhoto, warning } = draft;

  function updateContent(patch: Partial<CvImportDraft["content"]>) {
    setDraft((d) => ({ ...d, content: { ...d.content, ...patch } }));
  }

  function updateExperience(id: string, patch: Partial<CvImportDraft["content"]["experience"][number]>) {
    setDraft((d) => ({
      ...d,
      content: {
        ...d.content,
        experience: d.content.experience.map((exp) => (exp.id === id ? { ...exp, ...patch } : exp)),
      },
    }));
  }

  function updateEducation(id: string, patch: Partial<CvImportDraft["content"]["education"][number]>) {
    setDraft((d) => ({
      ...d,
      content: {
        ...d.content,
        education: d.content.education.map((edu) => (edu.id === id ? { ...edu, ...patch } : edu)),
      },
    }));
  }

  return (
    <div className="space-y-6">
      <Card className="flex items-start gap-3 border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">CV successfully analysed</p>
          <p className="mt-0.5 text-sm text-emerald-800">
            Please review your information before continuing.
          </p>
        </div>
      </Card>

      {warning && (
        <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">{warning}</p>
        </Card>
      )}

      {lowConfidenceFields.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Please review these details before creating your CV
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {lowConfidenceFields.map((field) => (
              <li key={field}>• {field}</li>
            ))}
          </ul>
        </Card>
      )}

      {hasProfilePhoto && (
        <Card className="p-4 text-sm text-slate-600">
          This CV appears to include a profile photograph. We don&apos;t auto-extract photos —
          once your CV is built, you can add one from the editor&apos;s photo uploader.
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Review your information</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing((e) => !e)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          {editing ? "Done editing" : "Edit Information"}
        </Button>
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Personal information
          </h3>
          <ConfidenceBadge score={confidence.contact_info} />
        </div>
        {editing ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input value={content.full_name} onChange={(e) => updateContent({ full_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={content.email} onChange={(e) => updateContent({ email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={content.phone} onChange={(e) => updateContent({ phone: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={content.location} onChange={(e) => updateContent({ location: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Website / LinkedIn</Label>
              <Input value={content.website} onChange={(e) => updateContent({ website: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Professional summary</Label>
              <Textarea rows={4} value={content.summary} onChange={(e) => updateContent({ summary: e.target.value })} />
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Field label="Full name" value={content.full_name} />
            <Field label="Email" value={content.email} />
            <Field label="Phone" value={content.phone} />
            <Field label="Location" value={content.location} />
            <Field label="Website / LinkedIn" value={content.website} className="sm:col-span-2" />
            {content.summary && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-400">Summary</dt>
                <dd className="mt-0.5 whitespace-pre-line text-slate-800">{content.summary}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Work experience ({content.experience.length})
          </h3>
          <ConfidenceBadge score={confidence.work_experience} />
        </div>
        {content.experience.length === 0 && <p className="text-sm text-slate-500">None detected.</p>}
        <div className="space-y-4">
          {content.experience.map((exp) => (
            <div key={exp.id} className="rounded-lg border border-slate-200 p-3">
              {editing ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Job title"
                    value={exp.title}
                    onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                  />
                  <Input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                  />
                  <Input
                    placeholder="Start date"
                    value={exp.start_date ?? ""}
                    onChange={(e) => updateExperience(exp.id, { start_date: e.target.value })}
                  />
                  <Input
                    placeholder="End date"
                    value={exp.end_date ?? ""}
                    onChange={(e) => updateExperience(exp.id, { end_date: e.target.value })}
                  />
                  <Textarea
                    className="sm:col-span-2"
                    rows={3}
                    placeholder="Description"
                    value={exp.description ?? ""}
                    onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-900">
                    {exp.title || "Untitled role"} {exp.company ? `— ${exp.company}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {exp.start_date || "?"} – {exp.current ? "Present" : exp.end_date || "?"}
                  </p>
                  {exp.description && (
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{exp.description}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Education ({content.education.length})
          </h3>
          <ConfidenceBadge score={confidence.education} />
        </div>
        {content.education.length === 0 && <p className="text-sm text-slate-500">None detected.</p>}
        <div className="space-y-3">
          {content.education.map((edu) => (
            <div key={edu.id} className="rounded-lg border border-slate-200 p-3">
              {editing ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Institution"
                    value={edu.school}
                    onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                  />
                  <Input
                    placeholder="Qualification"
                    value={edu.degree ?? ""}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                  />
                  <Input
                    placeholder="Start date"
                    value={edu.start_date ?? ""}
                    onChange={(e) => updateEducation(edu.id, { start_date: e.target.value })}
                  />
                  <Input
                    placeholder="End date"
                    value={edu.end_date ?? ""}
                    onChange={(e) => updateEducation(edu.id, { end_date: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-900">{edu.school || "Unnamed institution"}</p>
                  <p className="text-xs text-slate-500">
                    {edu.degree} {edu.field ? `· ${edu.field}` : ""}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Skills</h3>
          <ConfidenceBadge score={confidence.skills} />
        </div>
        {editing ? (
          <TagListEditor
            label="Skills"
            values={content.skills}
            onChange={(skills) => updateContent({ skills })}
          />
        ) : content.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {content.skills.map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">None detected.</p>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Certifications</h3>
        {editing ? (
          <TagListEditor
            label="Certifications"
            values={careerExtras.certifications}
            onChange={(certifications) =>
              setDraft((d) => ({ ...d, careerExtras: { ...d.careerExtras, certifications } }))
            }
          />
        ) : careerExtras.certifications.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {careerExtras.certifications.map((c) => (
              <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">None detected.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => onConfirm(draft)} disabled={confirming}>
          {confirming ? "Building your CV…" : "Confirm & Build My CV"}
        </Button>
        <Button type="button" variant="outline" onClick={onStartOver} disabled={confirming}>
          Start over
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value || <span className="text-slate-400">Not detected</span>}</dd>
    </div>
  );
}
