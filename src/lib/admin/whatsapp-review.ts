"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WhatsAppReviewStatus } from "@/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return { supabase, adminId: user.id };
}

/** Posts the admin's decision back to n8n so it can resume the conversation
 * (send the teaser on approval, or relay admin_notes back to the client on
 * rejection/changes-requested). Best-effort — never throws, since a failed
 * webhook call shouldn't strand the decision already saved in Supabase; an
 * admin can always follow up with the client directly if n8n never got it. */
async function notifyReviewDecision(reviewId: string, status: WhatsAppReviewStatus, adminNotes: string | null) {
  const url = process.env.N8N_REVIEW_DECISION_WEBHOOK_URL;
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!url || !secret) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ reviewId, status, adminNotes }),
    });
  } catch (err) {
    console.error("WhatsApp review decision webhook failed", err);
  }
}

async function decideReview(
  reviewId: string,
  status: WhatsAppReviewStatus,
  adminNotes: string
): Promise<{ error?: string }> {
  const { supabase, adminId } = await requireAdmin();

  const { data: review } = await supabase
    .from("whatsapp_review_queue")
    .select("status")
    .eq("id", reviewId)
    .single();
  if (!review) return { error: "Review item not found." };
  if (review.status !== "pending") return { error: "This item has already been reviewed." };

  const { error } = await supabase
    .from("whatsapp_review_queue")
    .update({
      status,
      admin_notes: adminNotes.trim() || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (error) return { error: error.message };

  await notifyReviewDecision(reviewId, status, adminNotes.trim() || null);

  revalidatePath("/dashboard/admin/whatsapp-orders");
  return {};
}

export async function approveWhatsAppReview(reviewId: string): Promise<{ error?: string }> {
  return decideReview(reviewId, "approved", "");
}

export async function rejectWhatsAppReview(reviewId: string, adminNotes: string): Promise<{ error?: string }> {
  return decideReview(reviewId, "rejected", adminNotes);
}

export async function requestWhatsAppChanges(reviewId: string, adminNotes: string): Promise<{ error?: string }> {
  if (!adminNotes.trim()) return { error: "Describe what needs to change before sending this back." };
  return decideReview(reviewId, "changes_requested", adminNotes);
}
