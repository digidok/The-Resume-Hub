import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateApplicationStatus, toggleShortlist } from "@/lib/jobs/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import type { ApplicationStatus, ResumeContent } from "@/types/database";

const STATUS_OPTIONS: Exclude<ApplicationStatus, "submitted">[] = [
  "interviewing",
  "offer",
  "rejected",
];

const FILTER_TABS: { value: "all" | ApplicationStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
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

function matchPercent(skills: string[], jobText: string) {
  if (skills.length === 0) return 0;
  const haystack = jobText.toLowerCase();
  const matched = skills.filter((skill) => haystack.includes(skill.toLowerCase()));
  return Math.round((matched.length / skills.length) * 100);
}

export default async function ApplicantsPage({
  params,
  searchParams,
}: PageProps<"/dashboard/jobs/[id]/applicants">) {
  const { id } = await params;
  const { q, status } = await searchParams;
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";
  const statusFilter = typeof status === "string" ? status : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, description")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();

  if (!job) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, cover_note, created_at, interview_scheduled_at, shortlisted, candidate_id, resume_id, profiles:candidate_id(full_name, headline), resumes:resume_id(title, slug, is_public, content)"
    )
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const rows = (applications ?? []).map((app) => {
    const candidate = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
    const resume = Array.isArray(app.resumes) ? app.resumes[0] : app.resumes;
    const content = resume?.content as ResumeContent | undefined;
    const skills = content?.skills ?? [];
    return {
      ...app,
      candidate,
      resume,
      skills,
      match: matchPercent(skills, job.description),
    };
  });

  const filtered = rows.filter((row) => {
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    if (!query) return true;
    const name = row.candidate?.full_name?.toLowerCase() ?? "";
    const skillHit = row.skills.some((s) => s.toLowerCase().includes(query));
    return name.includes(query) || skillHit;
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/dashboard/jobs/${id}`} className="text-sm text-brand-600 hover:underline">
        ← {job.title}
      </Link>
      <h1 className="mb-4 mt-1 text-2xl font-semibold text-slate-900">Applicants</h1>

      <form method="get" className="mb-4 flex flex-wrap items-center gap-3">
        <input type="hidden" name="status" value={statusFilter} />
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search by name or skill…"
          className="max-w-xs"
        />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/jobs/${id}/applicants?status=${tab.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              statusFilter === tab.value
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-8 text-center text-slate-500">No applicants match.</Card>
      )}

      <div className="space-y-4">
        {filtered.map((app) => {
          const status = app.status as ApplicationStatus;
          return (
            <Card key={app.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {app.candidate?.full_name || "Candidate"}
                  </p>
                  {app.candidate?.headline && (
                    <p className="text-sm text-slate-500">{app.candidate.headline}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                    {app.skills.length > 0 && ` · ${app.match}% keyword match`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {app.shortlisted && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Shortlisted
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              {app.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {app.skills.slice(0, 12).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {app.cover_note && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{app.cover_note}</p>
              )}

              {app.interview_scheduled_at && (
                <p className="mt-2 text-sm text-blue-700">
                  Interview scheduled: {new Date(app.interview_scheduled_at).toLocaleDateString()}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {app.resume && (
                  <a
                    href={`/r/${app.resume.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    View resume: {app.resume.title} →
                  </a>
                )}
                <form
                  action={async () => {
                    "use server";
                    await toggleShortlist(id, app.id, !app.shortlisted);
                  }}
                >
                  <Button type="submit" size="sm" variant="outline">
                    {app.shortlisted ? "Remove from shortlist" : "Shortlist"}
                  </Button>
                </form>
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

              <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-sm">
                <Link
                  href={`/dashboard/jobs/${id}/applicants/${app.id}/scorecard`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  Scorecard
                </Link>
                <Link
                  href={`/dashboard/jobs/${id}/applicants/${app.id}/offer`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  Offer letter
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
