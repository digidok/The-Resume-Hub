"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/actions";
import type { EmploymentType } from "@/types/database";

export async function createJob(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "employer") {
    return { error: "Only employer accounts can post jobs." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const employment_type = String(
    formData.get("employment_type") ?? "full_time"
  ) as EmploymentType;
  const description = String(formData.get("description") ?? "").trim();
  const salaryMinRaw = String(formData.get("salary_min") ?? "").trim();
  const salaryMaxRaw = String(formData.get("salary_max") ?? "").trim();

  if (!title || !company || !description) {
    return { error: "Title, company, and description are required." };
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      employer_id: user.id,
      title,
      company,
      location: location || null,
      employment_type,
      description,
      salary_min: salaryMinRaw ? Number(salaryMinRaw) : null,
      salary_max: salaryMaxRaw ? Number(salaryMaxRaw) : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create job." };
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath("/jobs");
  redirect(`/dashboard/jobs/${data.id}`);
}

export async function updateJobStatus(jobId: string, status: "open" | "closed") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("employer_id", user.id);

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath("/jobs");
}

export async function updateApplicationStatus(
  jobId: string,
  applicationId: string,
  status: "reviewed" | "rejected" | "accepted"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  revalidatePath(`/dashboard/jobs/${jobId}/applicants`);
}
