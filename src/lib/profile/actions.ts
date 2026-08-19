"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

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

export async function updatePhoneNumber(phone: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = phone.trim();
  const normalized = trimmed ? normalizePhone(trimmed) : null;

  const { error } = await supabase
    .from("profiles")
    // Clearing the number also turns off WhatsApp notifications — there's
    // nothing to send them to anymore.
    .update({ phone_number: normalized, whatsapp_opt_in: normalized ? undefined : false })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That number is already linked to another Resume Hub account." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return {};
}

export async function setWhatsAppOptIn(optIn: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("profiles").update({ whatsapp_opt_in: optIn }).eq("id", user.id);

  revalidatePath("/dashboard/profile");
}
