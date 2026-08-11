import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import type { ApplicationStatus } from "@/types/database";

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "bg-slate-100 text-slate-600",
  interviewing: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  hired: "bg-brand-100 text-brand-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function MyApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, created_at, interview_scheduled_at, jobs:job_id(id, title, company)")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-6 text-3xl font-bold text-slate-900">My applications</h1>

      {(!applications || applications.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          You haven&apos;t applied to any jobs yet.{" "}
          <Link href="/jobs" className="text-brand-600 hover:underline">
            Browse open roles →
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        {applications?.map((app) => {
          const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
          return (
            <Card key={app.id} className="flex items-center justify-between p-5">
              <div>
                <Link
                  href={job ? `/jobs/${job.id}` : "#"}
                  className="font-semibold text-slate-900 hover:text-brand-600"
                >
                  {job?.title ?? "Job"}
                </Link>
                <p className="text-sm text-slate-500">{job?.company}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </p>
                {app.interview_scheduled_at && (
                  <p className="mt-1 text-xs font-medium text-blue-600">
                    Interview: {new Date(app.interview_scheduled_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[app.status as ApplicationStatus]}`}
                >
                  {app.status}
                </span>
                {(app.status === "offer" || app.status === "hired") && (
                  <Link
                    href={`/dashboard/applications/${app.id}/offer`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    View offer letter
                  </Link>
                )}
                {app.status === "hired" && (
                  <Link
                    href={`/dashboard/applications/${app.id}/induction`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Start onboarding
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
