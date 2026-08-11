"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCoverLetter(jobId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("cover_letters")
    .insert({
      user_id: user.id,
      job_id: jobId || null,
      title: "Untitled Cover Letter",
      content: "",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create cover letter.");
  }

  revalidatePath("/dashboard/cover-letters");
  redirect(`/dashboard/cover-letters/${data.id}`);
}

export async function saveCoverLetter(
  coverLetterId: string,
  input: { title: string; content: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("cover_letters")
    .update({
      title: input.title || "Untitled Cover Letter",
      content: input.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", coverLetterId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/cover-letters/${coverLetterId}`);
  revalidatePath("/dashboard/cover-letters");
  return {};
}

export async function deleteCoverLetter(coverLetterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("cover_letters").delete().eq("id", coverLetterId).eq("user_id", user.id);

  revalidatePath("/dashboard/cover-letters");
  redirect("/dashboard/cover-letters");
}
