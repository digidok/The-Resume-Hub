"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, randomSuffix } from "@/lib/slug";
import { SUBSCRIPTION_PACKAGES } from "@/lib/payfast/config";
import type { ProfileRole, ProfilePlan, ResumeContent } from "@/types/database";

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

/** Issues an invoice number for an employer's invoice request — the point
 * at which admin has actually generated/sent the invoice for them to pay. */
export async function markInvoiceIssued(invoiceRequestId: string): Promise<{ error?: string }> {
  const supabase = await requireAdmin();

  const { data: invoice } = await supabase
    .from("invoice_requests")
    .select("status")
    .eq("id", invoiceRequestId)
    .single();
  if (!invoice || invoice.status !== "requested") {
    return { error: "This request has already been issued or handled." };
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

  const { error } = await supabase
    .from("invoice_requests")
    .update({ status: "invoiced", invoice_number: invoiceNumber, issued_at: new Date().toISOString() })
    .eq("id", invoiceRequestId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/invoices");
  return {};
}

/**
 * Marks an invoice as paid once the EFT has actually landed — grants the
 * same profile benefits a successful Payfast subscription payment would
 * (subscription_plan, a 30-day subscription_expires_at, job posting
 * credits), and logs it in the same payments ledger so it shows up
 * consistently in both the employer's own Payment history and the admin
 * Payments page.
 */
export async function markInvoicePaid(invoiceRequestId: string): Promise<{ error?: string }> {
  const supabase = await requireAdmin();

  const { data: invoice } = await supabase
    .from("invoice_requests")
    .select("*")
    .eq("id", invoiceRequestId)
    .single();
  if (!invoice) return { error: "Invoice request not found." };
  if (invoice.status === "paid") return { error: "Already marked paid." };
  if (invoice.status === "cancelled") return { error: "This request was cancelled." };

  const pkg = SUBSCRIPTION_PACKAGES.find((p) => p.id === invoice.package_id);
  if (!pkg) return { error: "Unknown product on this invoice." };

  const { error: paymentError } = await supabase.from("payments").insert({
    user_id: invoice.employer_id,
    m_payment_id: `invoice-${invoice.id}`,
    amount: invoice.amount_zar,
    item_name: `Resume Hub — ${pkg.label} (invoice ${invoice.invoice_number ?? invoice.id})`,
    credits_granted: 0,
    grants_pro: false,
    status: "complete",
    payment_type: "invoice",
    subscription_plan_target: pkg.id,
    job_credits_granted: pkg.jobCredits,
  });
  if (paymentError) return { error: paymentError.message };

  const { data: employerProfile } = await supabase
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", invoice.employer_id)
    .single();

  const currentExpiry = employerProfile?.subscription_expires_at
    ? new Date(employerProfile.subscription_expires_at)
    : null;
  const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const newExpiry = new Date(base.getTime() + 30 * 86400000).toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      subscription_plan: pkg.id,
      subscription_expires_at: newExpiry,
      job_posting_credits: pkg.jobCredits,
    })
    .eq("id", invoice.employer_id);
  if (profileError) return { error: profileError.message };

  const { error: statusError } = await supabase
    .from("invoice_requests")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceRequestId);
  if (statusError) return { error: statusError.message };

  revalidatePath("/dashboard/admin/invoices");
  revalidatePath("/dashboard/subscription");
  return {};
}

export async function cancelInvoiceRequest(invoiceRequestId: string): Promise<{ error?: string }> {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("invoice_requests")
    .update({ status: "cancelled" })
    .eq("id", invoiceRequestId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/invoices");
  return {};
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

/**
 * Same shape as saveResume/renameResumeSlug in lib/resumes/actions.ts, but
 * without the `user_id = caller` ownership filter — for staff editing a
 * candidate's CV on their behalf (e.g. a WhatsApp support request). Relies
 * on the "Admins can update all resumes" RLS policy for enforcement.
 */
export async function adminSaveResume(
  resumeId: string,
  input: {
    title: string;
    template: string;
    is_public: boolean;
    content: ResumeContent;
  }
): Promise<{ error?: string; slug?: string }> {
  const supabase = await requireAdmin();

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
    .select("slug, user_id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not save resume." };
  }

  revalidatePath(`/dashboard/admin/users/${data.user_id}`);
  revalidatePath(`/dashboard/admin/users/${data.user_id}/resumes/${resumeId}`);
  revalidatePath(`/r/${data.slug}`);
  return { slug: data.slug };
}

export async function adminRenameResumeSlug(
  resumeId: string,
  desiredSlug: string
): Promise<{ error?: string; slug?: string }> {
  const supabase = await requireAdmin();
  const cleanSlug = slugify(desiredSlug) || `resume-${randomSuffix(8)}`;

  const { data, error } = await supabase
    .from("resumes")
    .update({ slug: cleanSlug })
    .eq("id", resumeId)
    .select("slug, user_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "That link is already taken. Try another." };
    }
    return { error: error.message };
  }

  revalidatePath(`/dashboard/admin/users/${data?.user_id}/resumes/${resumeId}`);
  return { slug: data?.slug };
}
