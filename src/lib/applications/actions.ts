"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/actions";

export async function applyToJob(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jobId = String(formData.get("job_id") ?? "");
  if (!user) {
    redirect(`/login?redirect=/jobs/${jobId}`);
  }

  const resumeId = String(formData.get("resume_id") ?? "");
  const coverNote = String(formData.get("cover_note") ?? "").trim();

  if (!resumeId) {
    return { error: "Choose a resume to apply with." };
  }

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    candidate_id: user.id,
    resume_id: resumeId,
    cover_note: coverNote || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already applied to this job." };
    }
    return { error: error.message };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard/applications");
  return { message: "Application submitted!" };
}

/** Fire-and-forget wrapper for one-click apply forms that don't render inline error/success state. */
export async function quickApply(formData: FormData): Promise<void> {
  await applyToJob({}, formData);
}

export async function bulkApply(
  resumeId: string,
  coverNote: string,
  jobIds: string[]
): Promise<{ applied: number; skipped: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!resumeId || jobIds.length === 0) {
    return { applied: 0, skipped: 0, error: "Choose a resume and at least one job." };
  }

  const rows = jobIds.map((jobId) => ({
    job_id: jobId,
    candidate_id: user.id,
    resume_id: resumeId,
    cover_note: coverNote || null,
  }));

  const { data, error } = await supabase
    .from("applications")
    .upsert(rows, { onConflict: "job_id,candidate_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    return { applied: 0, skipped: 0, error: error.message };
  }

  const applied = data?.length ?? 0;
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/bulk-apply");
  return { applied, skipped: jobIds.length - applied };
}
