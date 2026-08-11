"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireEmployer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/dashboard");

  return { supabase, userId: user.id };
}

export async function saveInductionModule(input: {
  title: string;
  content: string;
  passThreshold: number;
}) {
  const { supabase, userId } = await requireEmployer();

  const { error } = await supabase.from("induction_modules").upsert(
    {
      employer_id: userId,
      title: input.title.trim() || "Company Induction",
      content: input.content,
      pass_threshold: Math.min(100, Math.max(1, input.passThreshold || 80)),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employer_id" }
  );

  revalidatePath("/dashboard/induction");
  return { error: error?.message };
}

export async function addInductionQuestion(input: {
  moduleId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  position: number;
}) {
  const { supabase } = await requireEmployer();

  const { error } = await supabase.from("induction_questions").insert({
    module_id: input.moduleId,
    question: input.question.trim(),
    options: input.options.map((o) => o.trim()),
    correct_option_index: input.correctOptionIndex,
    position: input.position,
  });

  revalidatePath("/dashboard/induction");
  return { error: error?.message };
}

export async function updateInductionQuestion(input: {
  questionId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}) {
  const { supabase } = await requireEmployer();

  const { error } = await supabase
    .from("induction_questions")
    .update({
      question: input.question.trim(),
      options: input.options.map((o) => o.trim()),
      correct_option_index: input.correctOptionIndex,
    })
    .eq("id", input.questionId);

  revalidatePath("/dashboard/induction");
  return { error: error?.message };
}

export async function deleteInductionQuestion(questionId: string) {
  const { supabase } = await requireEmployer();

  await supabase.from("induction_questions").delete().eq("id", questionId);

  revalidatePath("/dashboard/induction");
}

export async function submitInductionAttempt(
  applicationId: string,
  answers: Record<string, number>
): Promise<{ score?: number; passed?: boolean; correct?: number; total?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("submit_induction_attempt", {
    p_application_id: applicationId,
    p_answers: answers,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/applications/${applicationId}/induction`);
  return data as { score: number; passed: boolean; correct: number; total: number };
}
