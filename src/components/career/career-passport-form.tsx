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
    id_number: profile?.id_number ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
    has_drivers_license: profile?.has_drivers_license ?? false,
    drivers_license_code: profile?.drivers_license_code ?? "",
    has_criminal_record: profile?.has_criminal_record ?? null,
    criminal_record_details: profile?.criminal_record_details ?? "",
    has_been_arrested: profile?.has_been_arrested ?? null,
    arrest_details: profile?.arrest_details ?? "",
    background_consent_given: profile?.background_consent_given ?? false,
    background_consent_signed_name: profile?.background_consent_signed_name ?? "",
    background_consent_signed_at: profile?.background_consent_signed_at ?? null,
  };
}

function boolSelectValue(v: boolean | null): string {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "";
}

function parseBoolSelect(v: string): boolean | null {
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
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

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
        <p className="text-xs text-slate-500">
          South African employers commonly ask for these on application. Optional — fill in what
          you&apos;re comfortable sharing.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="id_number">SA ID number</Label>
            <Input
              id="id_number"
              inputMode="numeric"
              maxLength={13}
              placeholder="13-digit ID number"
              value={form.id_number ?? ""}
              onChange={(e) => update("id_number", e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={form.date_of_birth ?? ""}
              onChange={(e) => update("date_of_birth", e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="has_drivers_license"
            type="checkbox"
            checked={form.has_drivers_license}
            onChange={(e) => update("has_drivers_license", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <Label htmlFor="has_drivers_license" className="mb-0">
            I have a valid driver&apos;s licence
          </Label>
        </div>
        {form.has_drivers_license && (
          <div>
            <Label htmlFor="drivers_license_code">Licence code</Label>
            <Input
              id="drivers_license_code"
              placeholder="e.g. Code B, Code EB, Code 10"
              className="max-w-xs"
              value={form.drivers_license_code ?? ""}
              onChange={(e) => update("drivers_license_code", e.target.value)}
            />
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Background disclosure</h2>
        <p className="text-xs text-slate-500">
          Optional — only answer if a specific employer&apos;s application requires it. This
          information is treated as sensitive and is never shown to employers automatically;
          it&apos;s only visible if you separately consent to a background verification below.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="has_criminal_record">Do you have a criminal record?</Label>
            <Select
              id="has_criminal_record"
              value={boolSelectValue(form.has_criminal_record)}
              onChange={(e) => update("has_criminal_record", parseBoolSelect(e.target.value))}
            >
              <option value="">Prefer not to say</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="has_been_arrested">Have you ever been arrested?</Label>
            <Select
              id="has_been_arrested"
              value={boolSelectValue(form.has_been_arrested)}
              onChange={(e) => update("has_been_arrested", parseBoolSelect(e.target.value))}
            >
              <option value="">Prefer not to say</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </div>
        </div>
        {form.has_criminal_record && (
          <div>
            <Label htmlFor="criminal_record_details">Details</Label>
            <Input
              id="criminal_record_details"
              placeholder="Brief details — you'll be able to explain further if asked"
              value={form.criminal_record_details ?? ""}
              onChange={(e) => update("criminal_record_details", e.target.value)}
            />
          </div>
        )}
        {form.has_been_arrested && (
          <div>
            <Label htmlFor="arrest_details">Details</Label>
            <Input
              id="arrest_details"
              placeholder="Brief details — you'll be able to explain further if asked"
              value={form.arrest_details ?? ""}
              onChange={(e) => update("arrest_details", e.target.value)}
            />
          </div>
        )}
      </Card>

      <Card className="space-y-4 border-brand-200 bg-brand-50/40 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Background verification consent</h2>
        <p className="text-sm text-slate-600">
          Some employers require a background and qualification check (e.g. via LexisNexis or a
          similar verification provider) before finalising an offer. Giving consent here does{" "}
          <strong>not</strong> trigger a check by itself — it only authorises Resume Hub to share
          your uploaded documents with a specific employer once they request verification for an
          offer they&apos;ve made you, and for that employer to instruct a licensed verification
          provider on your behalf.
        </p>
        <div className="flex items-start gap-2">
          <input
            id="background_consent_given"
            type="checkbox"
            checked={form.background_consent_given}
            onChange={(e) => update("background_consent_given", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <Label htmlFor="background_consent_given" className="mb-0">
            I consent to Resume Hub sharing my uploaded ID, qualification, and reference documents
            with an employer who has made me an offer, for the purpose of a background and
            qualification verification check.
          </Label>
        </div>
        {form.background_consent_given && (
          <div>
            <Label htmlFor="background_consent_signed_name">Type your full name to sign</Label>
            <Input
              id="background_consent_signed_name"
              placeholder="Full name"
              className="max-w-sm"
              value={form.background_consent_signed_name ?? ""}
              onChange={(e) => update("background_consent_signed_name", e.target.value)}
            />
          </div>
        )}
        {profile?.background_consent_given && profile.background_consent_signed_at && (
          <p className="text-xs text-slate-500">
            Signed by {profile.background_consent_signed_name} on{" "}
            {new Date(profile.background_consent_signed_at).toLocaleDateString()}
          </p>
        )}
      </Card>
    </div>
  );
}
