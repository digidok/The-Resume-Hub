/** The single WhatsApp Business number this platform operates from — same number
 * used for the support chat link across the site and the n8n-bridged AI assistant. */
export const WHATSAPP_BUSINESS_NUMBER = "27693391915";

/** A wa.me link pre-filled with a deterministic "APPLY <jobId>" message, so the
 * inbound automation (n8n) can match it with a plain regex instead of needing
 * free-text intent parsing for the apply flow specifically. */
export function whatsappApplyLink(jobId: string) {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(`APPLY ${jobId}`)}`;
}
