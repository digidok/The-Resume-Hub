"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ResumeContent } from "@/types/database";

type ChecklistField =
  | "resume_reviewed"
  | "cover_letter_reviewed"
  | "contact_confirmed"
  | "work_auth_confirmed"
  | "salary_confirmed"
  | "questions_done";

export async function toggleChecklistItem(generationId: string, field: ChecklistField, value: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("review_checklist")
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq("ai_generation_id", generationId);

  revalidatePath(`/dashboard/applications/kit`);
}

export async function updateTailoredSummary(resumeId: string, summary: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resume } = await supabase
    .from("resumes")
    .select("content")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();
  if (!resume) return { error: "Resume not found." };

  const content = resume.content as ResumeContent;
  await supabase
    .from("resumes")
    .update({ content: { ...content, summary }, updated_at: new Date().toISOString() })
    .eq("id", resumeId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/applications/kit`);
  return {};
}

export async function updateTailoredExperience(resumeId: string, index: number, description: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resume } = await supabase
    .from("resumes")
    .select("content")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();
  if (!resume) return { error: "Resume not found." };

  const content = resume.content as ResumeContent;
  const experience = [...(content.experience ?? [])];
  if (!experience[index]) return { error: "Experience entry not found." };
  experience[index] = { ...experience[index], description };

  await supabase
    .from("resumes")
    .update({ content: { ...content, experience }, updated_at: new Date().toISOString() })
    .eq("id", resumeId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/applications/kit`);
  return {};
}

export async function updateTailoredCoverLetter(coverLetterId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("cover_letters")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", coverLetterId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/applications/kit`);
  return {};
}

export async function submitGeneratedApplication(generationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: generation }, { data: checklist }] = await Promise.all([
    supabase.from("ai_generations").select("*").eq("id", generationId).eq("user_id", user.id).single(),
    supabase.from("review_checklist").select("*").eq("ai_generation_id", generationId).single(),
  ]);

  if (!generation || !checklist) return { error: "Generation not found." };

  const { data: job } = await supabase.from("jobs").select("application_url").eq("id", generation.job_id).single();
  if (job?.application_url) {
    return { error: "This job accepts applications on its original site, not through Resume Hub." };
  }

  const allChecked =
    checklist.resume_reviewed &&
    checklist.cover_letter_reviewed &&
    checklist.contact_confirmed &&
    checklist.work_auth_confirmed &&
    checklist.salary_confirmed &&
    checklist.questions_done;

  if (!allChecked) return { error: "Complete all checklist items before submitting." };

  const { data: application, error } = await supabase
    .from("applications")
    .insert({
      job_id: generation.job_id,
      candidate_id: user.id,
      resume_id: generation.tailored_resume_id,
      cover_letter_id: generation.cover_letter_id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You've already applied to this job." };
    return { error: error.message };
  }

  await supabase.from("ai_generations").update({ application_id: application.id }).eq("id", generationId);

  revalidatePath("/dashboard/applications");
  redirect("/dashboard/applications");
}
