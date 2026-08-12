import type { SupabaseClient } from "@supabase/supabase-js";

export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export type ActivityType =
  | "applied"
  | "interview_scheduled"
  | "not_moved_forward"
  | "hired"
  | "job_saved"
  | "cover_letter_generated"
  | "follow_up_due";

export type ActivityItem = {
  type: ActivityType;
  title: string;
  subtitle: string;
  at: string;
};

function jobLabel(job: { title: string; company: string } | null) {
  return job ? `${job.title} @ ${job.company}` : "a role";
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

/**
 * Merges several real, timestamped tables into one recency-sorted feed —
 * there's no dedicated activity-log table, so this reconstructs "what
 * happened" from the rows that already exist.
 */
export async function getRecentActivity(
  supabase: SupabaseClient,
  userId: string,
  limit = 8
): Promise<ActivityItem[]> {
  const [{ data: applications }, { data: savedJobs }, { data: coverLetters }, { data: followUps }] =
    await Promise.all([
      supabase
        .from("applications")
        .select("id, status, created_at, updated_at, interview_scheduled_at, jobs:job_id(title, company)")
        .eq("candidate_id", userId)
        .order("updated_at", { ascending: false })
        .limit(limit),
      supabase
        .from("saved_jobs")
        .select("id, created_at, external_title, external_company, jobs:job_id(title, company)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("cover_letters")
        .select("id, created_at, job_id, jobs:job_id(title, company)")
        .eq("user_id", userId)
        .not("job_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("follow_ups")
        .select(
          "id, created_at, due_date, completed, applications:application_id(jobs:job_id(title, company))"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

  const items: ActivityItem[] = [];

  for (const app of applications ?? []) {
    const job = one(app.jobs);
    items.push({
      type: "applied",
      title: "Application submitted",
      subtitle: jobLabel(job),
      at: app.created_at,
    });
    if (app.interview_scheduled_at) {
      items.push({
        type: "interview_scheduled",
        title: "Interview scheduled",
        subtitle: `${jobLabel(job)} — ${new Date(app.interview_scheduled_at).toLocaleDateString()}`,
        at: app.updated_at,
      });
    }
    if (app.status === "rejected") {
      items.push({
        type: "not_moved_forward",
        title: "Application not moved forward",
        subtitle: jobLabel(job),
        at: app.updated_at,
      });
    }
    if (app.status === "hired") {
      items.push({
        type: "hired",
        title: "Offer accepted",
        subtitle: jobLabel(job),
        at: app.updated_at,
      });
    }
  }

  for (const saved of savedJobs ?? []) {
    const job = one(saved.jobs);
    const label = job ? jobLabel(job) : jobLabel(
      saved.external_title ? { title: saved.external_title, company: saved.external_company ?? "" } : null
    );
    items.push({
      type: "job_saved",
      title: "Job saved",
      subtitle: label,
      at: saved.created_at,
    });
  }

  for (const letter of coverLetters ?? []) {
    const job = one(letter.jobs);
    items.push({
      type: "cover_letter_generated",
      title: "AI cover letter generated",
      subtitle: jobLabel(job),
      at: letter.created_at,
    });
  }

  for (const followUp of followUps ?? []) {
    if (followUp.completed) continue;
    const application = one(followUp.applications);
    const job = application ? one(application.jobs) : null;
    items.push({
      type: "follow_up_due",
      title: "Follow-up reminder",
      subtitle: `${jobLabel(job)} — due ${new Date(followUp.due_date).toLocaleDateString()}`,
      at: followUp.created_at,
    });
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}
