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
