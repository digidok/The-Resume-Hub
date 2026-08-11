import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleFollowUp, deleteFollowUp } from "@/lib/followups/actions";
import { CreateFollowUpForm } from "@/components/followups/create-followup-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      "id, due_date, note, completed, application_id, applications:application_id(jobs:job_id(title, company))"
    )
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Follow-ups</h1>

      <CreateFollowUpForm applications={applicationOptions} />

      {(!followUps || followUps.length === 0) && (
        <Card className="p-8 text-center text-slate-500">No follow-ups yet.</Card>
      )}

      <div className="space-y-3">
        {followUps?.map((fu) => {
          const application = Array.isArray(fu.applications) ? fu.applications[0] : fu.applications;
          const job = application
            ? Array.isArray(application.jobs)
              ? application.jobs[0]
              : application.jobs
            : null;
          const overdue = !fu.completed && new Date(fu.due_date) < new Date(new Date().toDateString());
          return (
            <Card
              key={fu.id}
              className={`flex items-center justify-between p-4 ${fu.completed ? "opacity-60" : ""}`}
            >
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
                    {fu.completed ? "Mark undone" : "Mark done"}
                  </Button>
                </form>
                <form action={deleteFollowUp.bind(null, fu.id)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Delete
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
