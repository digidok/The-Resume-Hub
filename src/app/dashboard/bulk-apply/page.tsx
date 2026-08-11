import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BulkApplyForm } from "@/components/dashboard/bulk-apply-form";

export default async function BulkApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: resumes }, { data: jobs }, { data: existingApplications }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, title, company")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("applications").select("job_id").eq("candidate_id", user.id),
  ]);

  const appliedJobIds = new Set((existingApplications ?? []).map((a) => a.job_id));
  const availableJobs = (jobs ?? []).filter((job) => !appliedJobIds.has(job.id));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Bulk apply</h1>
      <p className="mb-6 text-sm text-slate-500">
        Apply to several open roles at once with the same resume.
      </p>
      <BulkApplyForm resumes={resumes ?? []} jobs={availableJobs} />
    </div>
  );
}
