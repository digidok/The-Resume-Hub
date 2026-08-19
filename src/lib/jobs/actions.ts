"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCandidate } from "@/lib/notifications/dispatch";
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
    .select("role, job_posting_credits")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "employer") {
    return { error: "Only employer accounts can post jobs." };
  }
  if (profile.job_posting_credits <= 0) {
    return {
      error:
        "You've used up your job posting allowance. Subscribe to the Employer Job Package to unlock 5 more job posts.",
    };
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
  const hiringManagerName = String(formData.get("hiring_manager_name") ?? "").trim();
  const hiringManagerTitle = String(formData.get("hiring_manager_title") ?? "").trim();
  const hiringManagerEmail = String(formData.get("hiring_manager_email") ?? "").trim();

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
      hiring_manager_name: hiringManagerName || null,
      hiring_manager_title: hiringManagerTitle || null,
      hiring_manager_email: hiringManagerEmail || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create job." };
  }

  await supabase
    .from("profiles")
    .update({ job_posting_credits: profile.job_posting_credits - 1 })
    .eq("id", user.id)
    .eq("job_posting_credits", profile.job_posting_credits);

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
  status: "interviewing" | "offer" | "rejected",
  interviewScheduledAt?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("applications")
    .update({
      status,
      interview_scheduled_at:
        status === "interviewing" && interviewScheduledAt ? interviewScheduledAt : null,
    })
    .eq("id", applicationId);

  revalidatePath(`/dashboard/jobs/${jobId}/applicants`);
  revalidatePath("/dashboard/applications");

  // Best-effort candidate notification (in-app + WhatsApp) — uses the admin
  // client since the candidate isn't the authenticated user in this request.
  try {
    const admin = createAdminClient();
    const { data: app } = await admin
      .from("applications")
      .select("candidate_id, jobs(title, company)")
      .eq("id", applicationId)
      .single();
    const jobInfo = app?.jobs as { title?: string; company?: string } | null;
    if (app && jobInfo) {
      const jobTitle = jobInfo.title ?? "the role";
      const company = jobInfo.company ?? "the employer";
      const STATUS_MESSAGES: Record<typeof status, string> = {
        interviewing: `You've been moved to interviewing for "${jobTitle}" at ${company}${
          status === "interviewing" && interviewScheduledAt
            ? ` — interview scheduled for ${new Date(interviewScheduledAt).toLocaleString()}`
            : ""
        }.`,
        offer: `You've received an offer for "${jobTitle}" at ${company}! Check your Applications page on resumehub.co.za to respond.`,
        rejected: `Your application for "${jobTitle}" at ${company} wasn't successful this time.`,
      };
      await notifyCandidate(admin, {
        userId: app.candidate_id,
        type: "application_status",
        title: "Application update",
        body: STATUS_MESSAGES[status],
      });
    }
  } catch (err) {
    console.error("Application status notification failed", err);
  }
}

export async function toggleShortlist(jobId: string, applicationId: string, shortlisted: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("applications").update({ shortlisted }).eq("id", applicationId);

  revalidatePath(`/dashboard/jobs/${jobId}/applicants`);
  revalidatePath("/dashboard");
}
