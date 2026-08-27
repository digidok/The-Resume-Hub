"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { whatsappContactLink } from "@/lib/whatsapp";

/** Persistent, always-visible WhatsApp contact button on the public marketing
 * site — hidden inside the dashboard, which already has its own AI assistant
 * entry point (Ask Els) for in-app help. */
export function WhatsAppFloatButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <a
      href={whatsappContactLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 transition hover:scale-105 hover:bg-emerald-700"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
