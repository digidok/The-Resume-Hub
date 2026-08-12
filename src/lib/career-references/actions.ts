"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReferenceRequestEmail } from "@/lib/notifications/email";

export async function addReference(input: {
  name: string;
  relationship: string;
  company: string;
  email: string;
  phone: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!input.name.trim()) return { error: "A name is required." };

  const { error } = await supabase.from("career_references").insert({
    user_id: user.id,
    name: input.name.trim(),
    relationship: input.relationship.trim() || null,
    company: input.company.trim() || null,
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/career-passport");
  return {};
}

export async function deleteReference(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("career_references").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/career-passport");
  return {};
}

export async function requestReference(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: reference } = await supabase
    .from("career_references")
    .select("email, request_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!reference) return { error: "Reference not found." };
  if (!reference.email) return { error: "Add an email address for this reference first." };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const { error } = await supabase
    .from("career_references")
    .update({ request_status: "requested", requested_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const submitUrl = `${protocol}://${host}/references/submit/${reference.request_token}`;

  await sendReferenceRequestEmail(reference.email, profile?.full_name || "A Resume Hub candidate", submitUrl);

  revalidatePath("/dashboard/career-passport");
  return {};
}

export type ReferenceRequestContext = {
  candidateName: string;
  status: "requested" | "received" | "not_requested";
};

/**
 * Public, unauthenticated lookup for the reference-submission page — the
 * token is an unguessable random UUID, and the admin client is only used
 * server-side (never exposed to the browser), so this doesn't need an RLS
 * policy that would otherwise let any anonymous request scan the table.
 */
export async function getReferenceRequestByToken(
  token: string
): Promise<ReferenceRequestContext | null> {
  const admin = createAdminClient();
  const { data: reference } = await admin
    .from("career_references")
    .select("user_id, request_status")
    .eq("request_token", token)
    .maybeSingle();
  if (!reference) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", reference.user_id)
    .single();

  return {
    candidateName: profile?.full_name || "A Resume Hub candidate",
    status: reference.request_status as ReferenceRequestContext["status"],
  };
}

export async function submitReference(token: string, referenceText: string): Promise<{ error?: string }> {
  if (!referenceText.trim()) return { error: "Please write a reference before submitting." };

  const admin = createAdminClient();
  const { data: reference } = await admin
    .from("career_references")
    .select("id")
    .eq("request_token", token)
    .maybeSingle();
  if (!reference) return { error: "This reference link isn't valid." };

  const { error } = await admin
    .from("career_references")
    .update({
      reference_text: referenceText.trim(),
      request_status: "received",
      received_at: new Date().toISOString(),
    })
    .eq("id", reference.id);

  if (error) return { error: error.message };
  return {};
}
