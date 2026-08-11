"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";

export async function runAutoApply(input: {
  resumeId: string;
  keywords: string;
  location: string;
}): Promise<{ matched: number; applied: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!input.resumeId) {
    return { matched: 0, applied: 0, error: "Choose a resume first." };
  }

  const keywordList = input.keywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  if (keywordList.length === 0) {
    return { matched: 0, applied: 0, error: "Enter at least one keyword." };
  }

  const spend = await spendCredits(supabase, user.id, "auto_apply");
  if (!spend.ok) {
    return { matched: 0, applied: 0, error: spend.error };
  }

  const [{ data: jobs }, { data: existingApplications }] = await Promise.all([
    supabase.from("jobs").select("id, title, description, location").eq("status", "open"),
    supabase.from("applications").select("job_id").eq("candidate_id", user.id),
  ]);

  const appliedJobIds = new Set((existingApplications ?? []).map((a) => a.job_id));
  const locationFilter = input.location.trim().toLowerCase();

  const matches = (jobs ?? []).filter((job) => {
    if (appliedJobIds.has(job.id)) return false;
    if (locationFilter && !(job.location ?? "").toLowerCase().includes(locationFilter)) {
      return false;
    }
    const haystack = `${job.title} ${job.description}`.toLowerCase();
    return keywordList.some((keyword) => haystack.includes(keyword));
  });

  if (matches.length === 0) {
    return { matched: 0, applied: 0 };
  }

  const rows = matches.map((job) => ({
    job_id: job.id,
    candidate_id: user.id,
    resume_id: input.resumeId,
    cover_note: "Submitted automatically by Resume Hub Auto-Apply based on your saved keywords.",
  }));

  const { data: inserted, error } = await supabase
    .from("applications")
    .upsert(rows, { onConflict: "job_id,candidate_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    return { matched: matches.length, applied: 0, error: error.message };
  }

  revalidatePath("/dashboard/applications");
  return { matched: matches.length, applied: inserted?.length ?? 0 };
}

export async function saveAutoApplySettings(input: {
  resumeId: string;
  keywords: string;
  location: string;
  enabled: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!input.resumeId) {
    return { error: "Choose a resume first." };
  }
  if (input.enabled && !input.keywords.trim()) {
    return { error: "Enter at least one keyword to enable scheduled auto-apply." };
  }

  const { error } = await supabase.from("auto_apply_settings").upsert(
    {
      user_id: user.id,
      resume_id: input.resumeId,
      keywords: input.keywords.trim(),
      location: input.location.trim() || null,
      enabled: input.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/auto-apply");
  return {};
}
