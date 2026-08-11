"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CareerProfile } from "@/types/database";

export type CareerProfileInput = Omit<
  CareerProfile,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export async function saveCareerProfile(
  input: CareerProfileInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("career_profiles").upsert(
    {
      user_id: user.id,
      ...input,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/career-passport");
  return {};
}
