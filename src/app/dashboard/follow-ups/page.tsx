import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { toggleFollowUp, deleteFollowUp } from "@/lib/followups/actions";
import { CreateFollowUpForm } from "@/components/followups/create-followup-form";
import { FollowUpDraft } from "@/components/followups/follow-up-draft";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function FollowUpsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from("applications")
    .select("id, jobs:job_id(title, company)")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  const applicationOptions = (applications ?? []).map((app) => {
    const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
    return { id: app.id, label: job ? `${job.title} at ${job.company}` : "Application" };
  });

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select(
      "id, due_date, note, completed, draft_subject, draft_body, sent, application_id, applications:application_id(jobs:job_id(title, company))"
    )
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  const list = followUps ?? [];
  const today = new Date(new Date().toDateString());
  const overdueCount = list.filter((fu) => !fu.completed && new Date(fu.due_date) < today).length;
  const dueThisWeekCount = list.filter((fu) => {
    if (fu.completed) return false;
    const due = new Date(fu.due_date);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    return due >= today && due <= in7Days;
  }).length;
  const completedCount = list.filter((fu) => fu.completed).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="text-3xl font-bold text-slate-900">Follow-ups</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={list.length} />
        <StatCard label="Due this week" value={dueThisWeekCount} />
        <StatCard label="Overdue" value={overdueCount} hint={overdueCount > 0 ? undefined : "All caught up"} />
        <StatCard label="Completed" value={completedCount} />
      </div>

      <CreateFollowUpForm applications={applicationOptions} />

      {list.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Bell className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">No follow-ups yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add a reminder above to check in after an application or interview — we&apos;ll flag
              it here when it&apos;s due.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.map((fu) => {
          const application = Array.isArray(fu.applications) ? fu.applications[0] : fu.applications;
          const job = application
            ? Array.isArray(application.jobs)
              ? application.jobs[0]
              : application.jobs
            : null;
          const overdue = !fu.completed && new Date(fu.due_date) < today;
          return (
            <Card key={fu.id} className={`p-4 ${fu.completed ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {job ? `${job.title} at ${job.company}` : "Application"}
                  </p>
                  {fu.note && <p className="text-sm text-slate-600">{fu.note}</p>}
                  <p className={`text-xs ${overdue ? "font-semibold text-red-600" : "text-slate-400"}`}>
                    Due {new Date(fu.due_date).toLocaleDateString()}
                    {overdue ? " · overdue" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleFollowUp.bind(null, fu.id, !fu.completed)}>
                    <Button type="submit" size="sm" variant={fu.completed ? "outline" : "secondary"}>
                      {fu.completed ? "Mark undone" : "Skip"}
                    </Button>
                  </form>
                  <form action={deleteFollowUp.bind(null, fu.id)}>
                    <Button type="submit" size="sm" variant="ghost">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
              <FollowUpDraft
                followUpId={fu.id}
                initialSubject={fu.draft_subject}
                initialBody={fu.draft_body}
                sent={fu.sent}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
