import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InductionQuiz } from "@/components/induction/induction-quiz";
import { Card } from "@/components/ui/card";
import type { InductionAttempt } from "@/types/database";

type ModuleResponse = {
  module_id: string;
  title: string;
  content: string;
  pass_threshold: number;
  questions: { id: string; question: string; options: string[] }[];
};

export default async function CandidateInductionPage({
  params,
}: PageProps<"/dashboard/applications/[id]/induction">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, jobs:job_id(title, company)")
    .eq("id", id)
    .eq("candidate_id", user.id)
    .single();
  if (!application) notFound();

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;

  if (application.status !== "hired") {
    return (
      <div className="mx-auto max-w-xl">
        <Link href="/dashboard/applications" className="text-sm text-brand-600 hover:underline">
          ← My applications
        </Link>
        <Card className="mt-4 p-8 text-center text-slate-500">
          Onboarding unlocks once you&apos;ve accepted an offer for this application.
        </Card>
      </div>
    );
  }

  const { data: moduleData } = await supabase.rpc("get_induction_module", {
    p_application_id: id,
  });
  const inductionModule = moduleData as ModuleResponse | null;

  const { data: attempts } = await supabase
    .from("induction_attempts")
    .select("*")
    .eq("application_id", id)
    .order("completed_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/applications" className="text-sm text-brand-600 hover:underline">
        ← My applications
      </Link>
      <h1 className="mb-1 mt-1 text-2xl font-semibold text-slate-900">Onboarding</h1>
      <p className="mb-6 text-sm text-slate-500">
        {job?.title} at {job?.company}
      </p>

      {!inductionModule ? (
        <Card className="p-8 text-center text-slate-500">
          Your employer hasn&apos;t set up an induction module yet — check back soon.
        </Card>
      ) : (
        <InductionQuiz
          applicationId={id}
          module={inductionModule}
          latestAttempt={(attempts?.[0] as InductionAttempt | undefined) ?? null}
        />
      )}
    </div>
  );
}
