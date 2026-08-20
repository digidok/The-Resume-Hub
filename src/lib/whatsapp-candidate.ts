import { randomUUID } from "crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

export type WhatsAppCandidateResult =
  | { ok: true; created: boolean; candidateId: string; email: string; magicLink: string }
  | { ok: false; error: string };

/** Finds the Resume Hub account linked to a WhatsApp number, or creates one —
 * shared by the standalone lead-capture webhook (/api/integrations/whatsapp/candidates)
 * and the done-for-you order provisioning webhook, so both funnels resolve
 * "this phone number" to "this account" the exact same way and never create
 * duplicate profiles for the same person. */
export async function findOrCreateWhatsAppCandidate(
  admin: ReturnType<typeof createAdminClient>,
  input: { phone: string; name?: string; email?: string; referredByCode?: string }
): Promise<WhatsAppCandidateResult> {
  const phone = normalizePhone(input.phone);

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();

  if (existingProfile) {
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(existingProfile.id);
    if (userError || !userData.user?.email) {
      return { ok: false, error: "Could not resolve existing candidate." };
    }
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
    });
    if (linkError) return { ok: false, error: linkError.message };
    await admin.from("profiles").update({ phone_number: phone }).eq("id", existingProfile.id);
    return {
      ok: true,
      created: false,
      candidateId: existingProfile.id,
      email: userData.user.email,
      magicLink: linkData.properties.action_link,
    };
  }

  const email = input.email?.trim() || `wa-${phone.replace(/[^\d]/g, "")}@leads.resumehub.co.za`;

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
    user_metadata: {
      full_name: input.name,
      role: "candidate",
      referred_by_code: input.referredByCode?.trim() || undefined,
    },
  });

  if (createError || !createdUser.user) {
    // Most likely cause: this email is already registered (e.g. the candidate signed
    // up directly before also messaging on WhatsApp). Link that existing account
    // instead of failing the webhook.
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkError || !linkData.user) {
      return { ok: false, error: createError?.message ?? "Could not create or link candidate." };
    }
    await admin.from("profiles").update({ phone_number: phone }).eq("id", linkData.user.id);
    return {
      ok: true,
      created: false,
      candidateId: linkData.user.id,
      email,
      magicLink: linkData.properties.action_link,
    };
  }

  await admin
    .from("profiles")
    .update({ phone_number: phone, source: "whatsapp" })
    .eq("id", createdUser.user.id);

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) return { ok: false, error: linkError.message };

  return {
    ok: true,
    created: true,
    candidateId: createdUser.user.id,
    email,
    magicLink: linkData.properties.action_link,
  };
}
