import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";

/** Creates an in-app notification and, if the candidate has opted in and has a
 * phone number on file, also sends it over WhatsApp. Best-effort throughout —
 * never throws, since a failed notification shouldn't break the action (a status
 * change, an auto-apply run) that triggered it. Requires an admin/service-role
 * client since the recipient usually isn't the request's authenticated user. */
export async function notifyCandidate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: SupabaseClient<any, any, any>,
  params: { userId: string; type: string; title: string; body: string; whatsappMessage?: string }
) {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
    });
  } catch (err) {
    console.error("In-app notification insert failed", err);
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone_number, whatsapp_opt_in")
      .eq("id", params.userId)
      .maybeSingle();
    if (profile?.phone_number && profile.whatsapp_opt_in) {
      await sendWhatsAppMessage(profile.phone_number, params.whatsappMessage ?? params.body);
    }
  } catch (err) {
    console.error("WhatsApp notification dispatch failed", err);
  }
}
