import { randomUUID, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationEmail } from "@/lib/notifications/email";
import { normalizePhone } from "@/lib/phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authorised(request: Request) {
  const secret = process.env.REGISTRATION_WEBHOOK_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Called by the business's client tracker when it registers a new client.
 * Creates the client's Resume Hub account (with a random password nobody
 * knows — the client signs in through the emailed one-time link, or sets their
 * own password via "forgot password") and emails them from RESEND_FROM_EMAIL.
 * If the email address already has an account the client signed up themselves,
 * so nothing is created and NO email is sent (pass resend:true to force one).
 * Idempotent: safe to retry. */
export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phoneRaw = typeof body?.phone === "string" ? body.phone.trim() : "";
  const resend = body?.resend === true;

  if (!EMAIL_RE.test(email) || email.endsWith("@leads.resumehub.co.za")) {
    return NextResponse.json({ error: "A valid client email is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
    user_metadata: {
      full_name: name,
      role: "candidate",
      phone_number: phoneRaw ? normalizePhone(phoneRaw) : undefined,
    },
  });

  const created = !createError && !!createdUser?.user;
  if (!created && !resend) {
    // Most likely the client already has an account, so don't email them.
    return NextResponse.json({ created: false, emailed: false, reason: "account already exists" });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { created, emailed: false, error: linkError?.message ?? "Could not create sign-in link." },
      { status: 500 }
    );
  }

  if (created) {
    await admin.from("profiles").update({ source: "tracker" }).eq("id", createdUser.user.id);
  }

  const emailed = await sendRegistrationEmail(email, name, linkData.properties.action_link);
  return NextResponse.json({ created, emailed });
}
