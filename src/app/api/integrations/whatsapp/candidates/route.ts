import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateWhatsAppCandidate } from "@/lib/whatsapp-candidate";

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const providedEmail = typeof body?.email === "string" ? body.email.trim() : undefined;
  const referredByCode = typeof body?.referredByCode === "string" ? body.referredByCode.trim() : undefined;

  if (!phoneRaw.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await findOrCreateWhatsAppCandidate(admin, {
    phone: phoneRaw,
    name,
    email: providedEmail,
    referredByCode,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    created: result.created,
    candidateId: result.candidateId,
    email: result.email,
    magicLink: result.magicLink,
  });
}
