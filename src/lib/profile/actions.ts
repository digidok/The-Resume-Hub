"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setOpenToWork(openToWork: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("profiles").update({ open_to_work: openToWork }).eq("id", user.id);

  revalidatePath("/dashboard/profile");
}

export async function updateAvatar(avatarUrl: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
}

export async function updateHeadline(headline: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = headline.trim();
  if (trimmed.length > 120) {
    return { error: "Headline must be 120 characters or fewer." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ headline: trimmed || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/profile");
  return {};
}
