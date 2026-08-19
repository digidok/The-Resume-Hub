/** Sends an outbound WhatsApp message via the n8n workflow that owns the actual
 * WhatsApp Business API connection (this app never talks to Meta's API directly —
 * see the WhatsApp chat/apply routes for the inbound side of that same bridge).
 * Best-effort: silently no-ops if the webhook isn't configured, and never throws,
 * since a failed WhatsApp send shouldn't break the action that triggered it. */
export async function sendWhatsAppMessage(phone: string, message: string) {
  const url = process.env.N8N_WHATSAPP_NOTIFY_URL;
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!url || !secret) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ phone, message }),
    });
  } catch (err) {
    console.error("WhatsApp notification send failed", err);
  }
}
