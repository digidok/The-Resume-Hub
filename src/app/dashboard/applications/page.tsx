import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { ApplicationsTour } from "@/components/dashboard/applications-tour";
import type { ApplicationStatus } from "@/types/database";

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "bg-slate-100 text-slate-600",
  interviewing: "bg-blue-100 text-blue-700",
  offer: "bg-emerald-100 text-emerald-700",
  hired: "bg-brand-100 text-brand-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LEGEND: { status: ApplicationStatus; label: string; hint: string }[] = [
  { status: "submitted", label: "Submitted", hint: "Applied, waiting to hear back" },
  { status: "interviewing", label: "Interviewing", hint: "In the interview process" },
  { status: "offer", label: "Offer", hint: "An offer's on the table" },
  { status: "hired", label: "Hired", hint: "You accepted — welcome aboard" },
  { status: "rejected", label: "Rejected", hint: "Didn't move forward this time" },
];

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

  const list = applications ?? [];
  const interviewingCount = list.filter((a) => a.status === "interviewing").length;
  const offerCount = list.filter((a) => a.status === "offer" || a.status === "hired").length;

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold text-slate-900">My applications</h1>
        <ApplicationsTour />
      </div>

      <div id="applications-stats" className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total applications" value={list.length} />
        <StatCard label="Interviewing" value={interviewingCount} />
        <StatCard label="Offers" value={offerCount} />
      </div>

      <div id="status-legend" className="mb-6 flex flex-wrap gap-2">
        {STATUS_LEGEND.map((item) => (
          <span
            key={item.status}
            title={item.hint}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}
          >
            {item.label}
          </span>
        ))}
      </div>

      {list.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">You haven&apos;t applied to any jobs yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Browse open roles and apply directly from your Resume Hub CV.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm">Browse open roles</Button>
          </Link>
        </Card>
      )}

      <div id="applications-list" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.map((app) => {
          const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
          return (
            <Card key={app.id} className="flex items-center justify-between p-5">
              <div>
                {job ? (
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-600"
                  >
                    {job.title}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-900">Job listing removed</p>
                )}
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
