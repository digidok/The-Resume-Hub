// WhatsApp numbers used by "Chat on WhatsApp" buttons on the public site.
// Digits only, international format, no "+" (e.g. 27821234567).
// Each section can use its own number. Set the env vars in Vercel to change a
// number without a code change; unset ones fall back to the main number.
const MAIN_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_MAIN ?? "27693391915";

export const WHATSAPP_NUMBERS = {
  main: MAIN_NUMBER,
  smallBusiness: process.env.NEXT_PUBLIC_WHATSAPP_SMALL_BUSINESS ?? MAIN_NUMBER,
  corporate: process.env.NEXT_PUBLIC_WHATSAPP_CORPORATE ?? MAIN_NUMBER,
} as const;

export type WhatsAppSection = keyof typeof WHATSAPP_NUMBERS;

export function whatsappLink(section: WhatsAppSection, message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBERS[section]}?text=${encodeURIComponent(message)}`;
}
