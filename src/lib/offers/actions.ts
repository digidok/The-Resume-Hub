"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveOfferDraft(jobId: string, applicationId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("offer_letters")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("offer_letters")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("offer_letters").insert({
      application_id: applicationId,
      employer_id: user.id,
      content,
    });
  }

  revalidatePath(`/dashboard/jobs/${jobId}/applicants/${applicationId}/offer`);
}

export async function sendOffer(jobId: string, applicationId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("offer_letters")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("offer_letters")
      .update({ content, status: "sent", updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("offer_letters").insert({
      application_id: applicationId,
      employer_id: user.id,
      content,
      status: "sent",
    });
  }

  await supabase.from("applications").update({ status: "offer" }).eq("id", applicationId);

  revalidatePath(`/dashboard/jobs/${jobId}/applicants/${applicationId}/offer`);
  revalidatePath(`/dashboard/jobs/${jobId}/applicants`);
}

export async function acceptOffer(offerId: string, applicationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("accept_offer", { p_offer_id: offerId });

  revalidatePath(`/dashboard/applications/${applicationId}/offer`);
  revalidatePath("/dashboard/applications");
  return { error: error?.message };
}

export async function declineOffer(offerId: string, applicationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("decline_offer", { p_offer_id: offerId });

  revalidatePath(`/dashboard/applications/${applicationId}/offer`);
  revalidatePath("/dashboard/applications");
  return { error: error?.message };
}
