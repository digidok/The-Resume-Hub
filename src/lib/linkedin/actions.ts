"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LinkedInExperienceEntry } from "@/types/database";

export async function updateLinkedInCopyPack(
  packId: string,
  input: { headline: string; about: string; experience: LinkedInExperienceEntry[]; skills: string[] }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("linkedin_copy_packs")
    .update({
      headline: input.headline.trim() || null,
      about: input.about.trim() || null,
      experience: input.experience,
      skills: input.skills,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/linkedin-copy-pack");
  return {};
}
