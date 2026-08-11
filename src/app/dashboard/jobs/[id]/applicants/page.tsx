import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateApplicationStatus } from "@/lib/jobs/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApplicationStatus } from "@/types/database";

const STATUS_OPTIONS: Exclude<ApplicationStatus, "submitted">[] = [
  "interviewing",
  "offer",
  "rejected",
];

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "bg-slate-100 text-slate-600",
  interviewing: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default async function ApplicantsPage({
  params,
}: PageProps<"/dashboard/jobs/[id]/applicants">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();

  if (!job) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, cover_note, created_at, interview_scheduled_at, candidate_id, resume_id, profiles:candidate_id(full_name, headline), resumes:resume_id(title, slug, is_public)"
    )
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/dashboard/jobs/${id}`} className="text-sm text-indigo-600 hover:underline">
        ← {job.title}
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-semibold text-slate-900">Applicants</h1>

      {(!applications || applications.length === 0) && (
        <Card className="p-8 text-center text-slate-500">No applications yet.</Card>
      )}

      <div className="space-y-4">
        {applications?.map((app) => {
          const candidate = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
          const resume = Array.isArray(app.resumes) ? app.resumes[0] : app.resumes;
          const status = app.status as ApplicationStatus;
          return (
            <Card key={app.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {candidate?.full_name || "Candidate"}
                  </p>
                  {candidate?.headline && (
                    <p className="text-sm text-slate-500">{candidate.headline}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>

              {app.cover_note && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{app.cover_note}</p>
              )}

              {app.interview_scheduled_at && (
                <p className="mt-2 text-sm text-blue-700">
                  Interview scheduled: {new Date(app.interview_scheduled_at).toLocaleDateString()}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {resume && (
                  <a
                    href={`/r/${resume.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    View resume: {resume.title} →
                  </a>
                )}
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const newStatus = formData.get("status") as "interviewing" | "offer" | "rejected";
                    const interviewDate = String(formData.get("interview_date") ?? "") || undefined;
                    await updateApplicationStatus(id, app.id, newStatus, interviewDate);
                  }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <select
                    name="status"
                    defaultValue={status === "submitted" ? "interviewing" : status}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    name="interview_date"
                    defaultValue={toDateInputValue(app.interview_scheduled_at)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600"
                    title="Interview date (only used when status is set to interviewing)"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Update
                  </Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
