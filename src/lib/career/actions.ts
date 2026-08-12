"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CareerProfile, ResumeContent } from "@/types/database";

export type CareerProfileInput = Omit<
  CareerProfile,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export async function saveCareerProfile(
  input: CareerProfileInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Consent timestamp is stamped server-side, never trusted from the
  // client — only set once, the first time consent flips to true, and
  // cleared if consent is withdrawn.
  let signedAt: string | null = null;
  if (input.background_consent_given) {
    const { data: existing } = await supabase
      .from("career_profiles")
      .select("background_consent_given, background_consent_signed_at")
      .eq("user_id", user.id)
      .maybeSingle();
    signedAt = existing?.background_consent_given
      ? (existing.background_consent_signed_at as string | null)
      : new Date().toISOString();
  }

  const { error } = await supabase.from("career_profiles").upsert(
    {
      user_id: user.id,
      ...input,
      background_consent_signed_at: signedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/career-passport");
  return {};
}

function union(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((v) => v.trim().toLowerCase()));
  const added = incoming.filter((v) => v.trim() && !seen.has(v.trim().toLowerCase()));
  return [...existing, ...added];
}

export type CareerExtras = {
  professionalTitle?: string;
  certifications?: string[];
  linkedinUrl?: string;
};

/**
 * Non-destructive sync: unions array fields (skills, languages,
 * certifications), and only fills scalar fields (title, LinkedIn URL) if
 * they're currently blank. Never overwrites anything the candidate already
 * entered in their Career Passport.
 */
export async function syncResumeToCareerPassport(
  content: ResumeContent,
  extras?: CareerExtras
): Promise<{ error?: string; addedSkills?: number; addedLanguages?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("career_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const current = existing as CareerProfile | null;
  const existingSkills = current?.skills ?? [];
  const existingLanguages = current?.languages ?? [];
  const existingCertifications = current?.certifications ?? [];
  const mergedSkills = union(existingSkills, content.skills);
  const mergedLanguages = union(existingLanguages, content.languages);
  const mergedCertifications = union(existingCertifications, extras?.certifications ?? []);

  const mostRecentTitle = content.experience.find((exp) => exp.current)?.title || content.experience[0]?.title;

  const { error } = await supabase.from("career_profiles").upsert(
    {
      user_id: user.id,
      professional_title: current?.professional_title || extras?.professionalTitle || mostRecentTitle || null,
      career_level: current?.career_level ?? null,
      industry: current?.industry ?? null,
      years_experience: current?.years_experience ?? null,
      target_roles: current?.target_roles ?? [],
      preferred_locations: current?.preferred_locations ?? [],
      salary_min: current?.salary_min ?? null,
      salary_max: current?.salary_max ?? null,
      employment_type: current?.employment_type ?? null,
      work_preference: current?.work_preference ?? null,
      qualifications: current?.qualifications ?? [],
      certifications: mergedCertifications,
      linkedin_url: current?.linkedin_url || extras?.linkedinUrl || null,
      portfolio_url: current?.portfolio_url ?? null,
      skills: mergedSkills,
      languages: mergedLanguages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/career-passport");
  return {
    addedSkills: mergedSkills.length - existingSkills.length,
    addedLanguages: mergedLanguages.length - existingLanguages.length,
  };
}
