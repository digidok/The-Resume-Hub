"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/actions";

export async function createFollowUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const applicationId = String(formData.get("application_id") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!applicationId || !dueDate) {
    return { error: "Pick an application and a due date." };
  }

  const { error } = await supabase.from("follow_ups").insert({
    application_id: applicationId,
    user_id: user.id,
    due_date: dueDate,
    note: note || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/follow-ups");
  return { message: "Follow-up added." };
}

export async function toggleFollowUp(followUpId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follow_ups")
    .update({ completed })
    .eq("id", followUpId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/follow-ups");
}

export async function deleteFollowUp(followUpId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("follow_ups").delete().eq("id", followUpId).eq("user_id", user.id);

  revalidatePath("/dashboard/follow-ups");
}
