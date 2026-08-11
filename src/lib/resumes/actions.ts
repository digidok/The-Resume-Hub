"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { randomSuffix, slugify } from "@/lib/slug";
import { emptyResumeContent, type ResumeContent } from "@/types/database";

export async function createResume() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = `resume-${randomSuffix(8)}`;
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: "Untitled Resume",
      slug,
      content: emptyResumeContent(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create resume.");
  }

  revalidatePath("/dashboard/resumes");
  redirect(`/dashboard/resumes/${data.id}`);
}

export async function saveResume(
  resumeId: string,
  input: {
    title: string;
    template: string;
    is_public: boolean;
    content: ResumeContent;
  }
): Promise<{ error?: string; slug?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("resumes")
    .update({
      title: input.title || "Untitled Resume",
      template: input.template,
      is_public: input.is_public,
      content: input.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .select("slug")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not save resume." };
  }

  revalidatePath(`/dashboard/resumes/${resumeId}`);
  revalidatePath("/dashboard/resumes");
  revalidatePath(`/r/${data.slug}`);
  return { slug: data.slug };
}

export async function deleteResume(resumeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/resumes");
  redirect("/dashboard/resumes");
}

export async function renameResumeSlug(
  resumeId: string,
  desiredSlug: string
): Promise<{ error?: string; slug?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const cleanSlug = slugify(desiredSlug) || `resume-${randomSuffix(8)}`;

  const { data, error } = await supabase
    .from("resumes")
    .update({ slug: cleanSlug })
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "That link is already taken. Try another." };
    }
    return { error: error.message };
  }

  revalidatePath(`/dashboard/resumes/${resumeId}`);
  return { slug: data?.slug };
}
