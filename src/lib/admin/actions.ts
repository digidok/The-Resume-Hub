"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return supabase;
}

export async function setUserRole(userId: string, role: ProfileRole) {
  const supabase = await requireAdmin();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/dashboard/admin/users");
}

export async function grantCredits(userId: string, amount: number) {
  const supabase = await requireAdmin();
  if (!Number.isFinite(amount) || amount === 0) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", userId)
    .single();
  if (!profile) return;

  await supabase
    .from("profiles")
    .update({ credits_remaining: Math.max(0, profile.credits_remaining + amount) })
    .eq("id", userId);

  revalidatePath("/dashboard/admin/users");
}

/**
 * Manual override for when a payment is refunded or a subscription is
 * cancelled directly in the Payfast dashboard — Payfast doesn't reliably
 * notify us of either via webhook, so this is how an admin corrects the
 * account after handling it on the Payfast side.
 */
export async function revokeSubscription(userId: string) {
  const supabase = await requireAdmin();
  await supabase
    .from("profiles")
    .update({
      plan: "free",
      subscription_plan: null,
      subscription_expires_at: null,
      payfast_token: null,
    })
    .eq("id", userId);
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/payments");
}

export async function markPaymentRefunded(paymentId: string) {
  const supabase = await requireAdmin();
  await supabase.from("payments").update({ status: "refunded" }).eq("id", paymentId);
  revalidatePath("/dashboard/admin/payments");
}

export async function setJobStatus(jobId: string, status: "open" | "closed") {
  const supabase = await requireAdmin();
  await supabase.from("jobs").update({ status }).eq("id", jobId);
  revalidatePath("/dashboard/admin/jobs");
}
