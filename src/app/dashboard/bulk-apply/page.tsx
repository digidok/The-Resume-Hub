import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BulkApplyForm } from "@/components/dashboard/bulk-apply-form";
import { Card } from "@/components/ui/card";

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
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Bulk apply</h1>
      <p className="mb-6 text-sm text-slate-500">
        Apply to several open roles at once with the same resume.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <BulkApplyForm resumes={resumes ?? []} jobs={availableJobs} />
        </div>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-900">Good to know</p>
          </div>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
            <li>The same resume is submitted to every job you select.</li>
            <li>Jobs you&apos;ve already applied to are left out automatically.</li>
            <li>Only currently open roles are listed here.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
