import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { AiGeneratorForm } from "@/components/dashboard/ai-generator-form";
import { Card } from "@/components/ui/card";

export default async function AiGeneratorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: resumes }, { data: jobs }] = await Promise.all([
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
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">AI generator</h1>
      <p className="mb-6 text-sm text-slate-500">
        Generate a cover letter tailored to a specific job, using your real resume content.
      </p>
      <Card className="p-6">
        <AiGeneratorForm resumes={resumes ?? []} jobs={jobs ?? []} />
      </Card>
    </div>
  );
}
