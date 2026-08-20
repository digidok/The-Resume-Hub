"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { updateLinkedInCopyPack } from "@/lib/linkedin/actions";
import type { LinkedInCopyPack, LinkedInExperienceEntry } from "@/types/database";

export function LinkedInPackCard({ pack }: { pack: LinkedInCopyPack }) {
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(pack.headline ?? "");
  const [about, setAbout] = useState(pack.about ?? "");
  const [skills, setSkills] = useState(pack.skills.join(", "));
  const [experience, setExperience] = useState<LinkedInExperienceEntry[]>(pack.experience);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateLinkedInCopyPack(pack.id, {
        headline,
        about,
        experience,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if (res.error) setError(res.error);
      else setEditing(false);
    });
  }

  function updateExperience(index: number, patch: Partial<LinkedInExperienceEntry>) {
    setExperience((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Headline</p>
        {!editing && <CopyButton text={headline} />}
      </div>
      {editing ? (
        <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Your LinkedIn headline" />
      ) : (
        <p className="text-sm text-slate-800">{headline || "—"}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">About</p>
        {!editing && <CopyButton text={about} />}
      </div>
      {editing ? (
        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={5} placeholder="Your About section" />
      ) : (
        <p className="whitespace-pre-line text-sm text-slate-800">{about || "—"}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Skills</p>
        {!editing && <CopyButton text={pack.skills.join(", ")} />}
      </div>
      {editing ? (
        <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skill, skill, skill" />
      ) : (
        <p className="text-sm text-slate-800">{pack.skills.length ? pack.skills.join(" · ") : "—"}</p>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Experience</p>
        <div className="space-y-4">
          {experience.map((entry, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              {editing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={entry.role}
                      onChange={(e) => updateExperience(i, { role: e.target.value })}
                      placeholder="Role"
                    />
                    <Input
                      value={entry.company}
                      onChange={(e) => updateExperience(i, { company: e.target.value })}
                      placeholder="Company"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExperience((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={entry.bullets.join("\n")}
                    onChange={(e) => updateExperience(i, { bullets: e.target.value.split("\n") })}
                    rows={3}
                    placeholder="One bullet per line"
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {entry.role} {entry.company && `· ${entry.company}`}
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                      {entry.bullets.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <CopyButton text={entry.bullets.join("\n")} />
                </div>
              )}
            </div>
          ))}
          {editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExperience((prev) => [...prev, { role: "", company: "", bullets: [] }])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add role
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {editing ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
    </Card>
  );
}
