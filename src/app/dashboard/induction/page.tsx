import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InductionEditor } from "@/components/induction/induction-editor";
import type { InductionModule, InductionQuestion } from "@/types/database";

export default async function InductionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/dashboard");

  const { data: inductionModule } = await supabase
    .from("induction_modules")
    .select("*")
    .eq("employer_id", user.id)
    .maybeSingle();

  const { data: questions } = inductionModule
    ? await supabase
        .from("induction_questions")
        .select("*")
        .eq("module_id", inductionModule.id)
        .order("position", { ascending: true })
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Induction &amp; onboarding</h1>
      <p className="mb-6 text-sm text-slate-500">
        Build a study module and quiz that new hires must pass after they accept an offer, before
        they&apos;re fully onboarded.
      </p>
      <InductionEditor
        module={inductionModule as InductionModule | null}
        questions={(questions ?? []) as InductionQuestion[]}
      />
    </div>
  );
}
