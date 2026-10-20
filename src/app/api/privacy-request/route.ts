import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEAM_EMAIL, emailBody, esc, sendEmail } from "@/lib/business/notify";

const TYPES = ["access", "correction", "deletion", "marketing_opt_out", "complaint"] as const;
const LABEL: Record<(typeof TYPES)[number], string> = {
  access: "Access my information",
  correction: "Correct my information",
  deletion: "Delete my information",
  marketing_opt_out: "Stop marketing communications",
  complaint: "Privacy complaint",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (clean(body.website, 100)) return NextResponse.json({ reference: "PRV-000000" });

  const type = clean(body.type, 40) as (typeof TYPES)[number];
  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const details = clean(body.details, 3000);
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Please choose a request type." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Requests are temporarily unavailable. Please email info@resumehub.co.za." }, { status: 503 });
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("privacy_requests")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i++) ref += alphabet[Math.floor(Math.random() * alphabet.length)];
  const reference = `PRV-${ref}`;

  const { error } = await admin
    .from("privacy_requests")
    .insert({ reference, request_type: type, name, email, details: details || null });
  if (error) {
    console.error("privacy_requests insert failed", error);
    return NextResponse.json({ error: "We couldn't save your request. Please try again." }, { status: 500 });
  }

  await sendEmail({
    to: TEAM_EMAIL,
    replyTo: email,
    subject: `Privacy request ${reference}: ${LABEL[type]}`,
    html: `<p><strong>${esc(reference)}</strong> from ${esc(name)} (${esc(email)})</p><p>${esc(LABEL[type])}</p><p>${esc(details || "No details.").replace(/\n/g, "<br>")}</p><p>Verify identity before releasing or deleting any information.</p>`,
  });
  await sendEmail({
    to: email,
    replyTo: TEAM_EMAIL,
    subject: `We received your privacy request (${reference})`,
    html: emailBody(name, [
      `We have received your request: <strong>${esc(LABEL[type])}</strong>. Your reference is <strong>${esc(reference)}</strong>.`,
      "We may need to confirm your identity before we act on it. We will come back to you as soon as we can. You may also lodge a complaint with South Africa's Information Regulator (inforegulator.org.za).",
    ]),
  });

  return NextResponse.json({ reference });
}
