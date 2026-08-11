"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TagListEditor } from "@/components/career/tag-list-editor";
import { saveCareerProfile, type CareerProfileInput } from "@/lib/career/actions";
import type { CareerProfile } from "@/types/database";

function toFormState(profile: CareerProfile | null): CareerProfileInput {
  return {
    professional_title: profile?.professional_title ?? "",
    years_experience: profile?.years_experience ?? null,
    career_level: profile?.career_level ?? "",
    industry: profile?.industry ?? "",
    target_roles: profile?.target_roles ?? [],
    preferred_locations: profile?.preferred_locations ?? [],
    salary_min: profile?.salary_min ?? null,
    salary_max: profile?.salary_max ?? null,
    employment_type: profile?.employment_type ?? "",
    work_preference: profile?.work_preference ?? "",
    skills: profile?.skills ?? [],
    qualifications: profile?.qualifications ?? [],
    certifications: profile?.certifications ?? [],
    languages: profile?.languages ?? [],
    linkedin_url: profile?.linkedin_url ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
  };
}

export function CareerPassportForm({ profile }: { profile: CareerProfile | null }) {
  const router = useRouter();
  const [form, setForm] = useState<CareerProfileInput>(toFormState(profile));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CareerProfileInput>(key: K, value: CareerProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await saveCareerProfile(form);
    if (result.error) {
      setError(result.error);
    } else {
      setStatus("Saved");
      router.refresh();
      setTimeout(() => setStatus(null), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Career overview</h2>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
        {status && <p className="text-sm text-emerald-600">{status}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="professional_title">Professional title</Label>
            <Input
              id="professional_title"
              placeholder="e.g. Senior HR Manager"
              value={form.professional_title ?? ""}
              onChange={(e) => update("professional_title", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="years_experience">Years of experience</Label>
            <Input
              id="years_experience"
              type="number"
              min={0}
              value={form.years_experience ?? ""}
              onChange={(e) => update("years_experience", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label htmlFor="career_level">Career level</Label>
            <Select
              id="career_level"
              value={form.career_level ?? ""}
              onChange={(e) => update("career_level", e.target.value)}
            >
              <option value="">Select level</option>
              <option value="graduate">Graduate</option>
              <option value="entry_level">Entry-level</option>
              <option value="mid_level">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Mining, Finance, Tech"
              value={form.industry ?? ""}
              onChange={(e) => update("industry", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="employment_type">Employment type</Label>
            <Select
              id="employment_type"
              value={form.employment_type ?? ""}
              onChange={(e) => update("employment_type", e.target.value)}
            >
              <option value="">Any</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="work_preference">Work preference</Label>
            <Select
              id="work_preference"
              value={form.work_preference ?? ""}
              onChange={(e) => update("work_preference", e.target.value)}
            >
              <option value="">Any</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="salary_min">Target salary (min)</Label>
            <Input
              id="salary_min"
              type="number"
              min={0}
              value={form.salary_min ?? ""}
              onChange={(e) => update("salary_min", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label htmlFor="salary_max">Target salary (max)</Label>
            <Input
              id="salary_max"
              type="number"
              min={0}
              value={form.salary_max ?? ""}
              onChange={(e) => update("salary_max", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <TagListEditor
          label="Target roles"
          placeholder="e.g. HR Manager"
          values={form.target_roles}
          onChange={(v) => update("target_roles", v)}
        />
        <TagListEditor
          label="Preferred locations"
          placeholder="e.g. Johannesburg"
          values={form.preferred_locations}
          onChange={(v) => update("preferred_locations", v)}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Skills & qualifications</h2>
        <TagListEditor label="Skills" values={form.skills} onChange={(v) => update("skills", v)} />
        <TagListEditor
          label="Qualifications"
          placeholder="e.g. BCom Human Resources"
          values={form.qualifications}
          onChange={(v) => update("qualifications", v)}
        />
        <TagListEditor
          label="Certifications"
          placeholder="e.g. SAP SuccessFactors"
          values={form.certifications}
          onChange={(v) => update("certifications", v)}
        />
        <TagListEditor
          label="Languages"
          values={form.languages}
          onChange={(v) => update("languages", v)}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Links</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              placeholder="https://linkedin.com/in/..."
              value={form.linkedin_url ?? ""}
              onChange={(e) => update("linkedin_url", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="portfolio_url">Portfolio URL</Label>
            <Input
              id="portfolio_url"
              placeholder="https://..."
              value={form.portfolio_url ?? ""}
              onChange={(e) => update("portfolio_url", e.target.value)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
