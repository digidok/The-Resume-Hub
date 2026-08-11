"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedJob(jobId: string, save: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/jobs/${jobId}`);

  if (save) {
    await supabase.from("saved_jobs").insert({ user_id: user.id, job_id: jobId });
  } else {
    await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard/saved-jobs");
}

export async function removeSavedJobById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("saved_jobs").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/dashboard/saved-jobs");
}
