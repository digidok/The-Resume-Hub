"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole, ProfilePlan } from "@/types/database";

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

export async function updateUserProfile(
  userId: string,
  input: {
    full_name: string;
    email: string;
    phone_number: string;
    role: ProfileRole;
    plan: ProfilePlan;
    credits_remaining: number;
  }
): Promise<{ error?: string }> {
  const supabase = await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();
  const { data: currentUser } = await admin.auth.admin.getUserById(userId);
  if (currentUser?.user && currentUser.user.email !== email) {
    const { error: emailError } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
    if (emailError) return { error: emailError.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name.trim() || null,
      phone_number: input.phone_number.trim() || null,
      role: input.role,
      plan: input.plan,
      credits_remaining: Math.max(0, Math.floor(input.credits_remaining) || 0),
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  return {};
}

export async function setUserPassword(
  userId: string,
  newPassword: string
): Promise<{ error?: string }> {
  await requireAdmin();
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { error: error.message };

  return {};
}

/**
 * Permanently deletes the auth user; `profiles.id references auth.users(id)
 * on delete cascade` takes care of the profile row and everything chained
 * off it (resumes, applications, saved jobs, etc.).
 */
export async function deleteUser(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/users");
  redirect("/dashboard/admin/users");
}

export async function createCandidate(input: {
  full_name: string;
  email: string;
  phone_number: string;
}): Promise<{ error?: string; candidateId?: string }> {
  await requireAdmin();

  const fullName = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone_number.trim();

  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();
  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "candidate" },
  });

  if (createError || !createdUser.user) {
    return { error: createError?.message ?? "Could not create candidate." };
  }

  await admin
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone_number: phone || null,
      source: "admin",
    })
    .eq("id", createdUser.user.id);

  revalidatePath("/dashboard/admin/users");
  return { candidateId: createdUser.user.id };
}
