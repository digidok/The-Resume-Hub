import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

async function linkExistingCandidate(
  supabase: ReturnType<typeof createAdminClient>,
  candidateId: string,
  email: string,
  phone: string
) {
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  await supabase.from("profiles").update({ phone_number: phone }).eq("id", candidateId);

  return NextResponse.json({
    created: false,
    candidateId,
    email,
    magicLink: linkData.properties.action_link,
  });
}

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

  if (!phoneRaw.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const phone = normalizePhone(phoneRaw);
  const supabase = createAdminClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();

  if (existingProfile) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      existingProfile.id
    );
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: "Could not resolve existing candidate." }, { status: 500 });
    }
    return linkExistingCandidate(supabase, existingProfile.id, userData.user.email, phone);
  }

  const email = providedEmail || `wa-${phone.replace(/[^\d]/g, "")}@leads.resumehub.co.za`;

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: name, role: "candidate" },
  });

  if (createError || !createdUser.user) {
    // Most likely cause: this email is already registered (e.g. the candidate signed
    // up directly before also messaging on WhatsApp). Link that existing account
    // instead of failing the webhook.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkError || !linkData.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create or link candidate." },
        { status: 500 }
      );
    }
    await supabase
      .from("profiles")
      .update({ phone_number: phone })
      .eq("id", linkData.user.id);
    return NextResponse.json({
      created: false,
      candidateId: linkData.user.id,
      email,
      magicLink: linkData.properties.action_link,
    });
  }

  await supabase
    .from("profiles")
    .update({ phone_number: phone, source: "whatsapp" })
    .eq("id", createdUser.user.id);

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({
    created: true,
    candidateId: createdUser.user.id,
    email,
    magicLink: linkData.properties.action_link,
  });
}
