import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_DIVISIONS, availableServices } from "@/lib/catalog/divisions";
import { applyOverrides, getOverrides } from "@/lib/catalog/overrides";

const NOTIFY_TO = "info@resumehub.co.za";
const MAX_PER_HOUR = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function makeReference(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `ENQ-${out}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in.
  if (clean(body.website, 100)) return NextResponse.json({ reference: "ENQ-000000" });

  const baseDivision = ALL_DIVISIONS.find((d) => d.slug === clean(body.division, 60));
  if (!baseDivision) return NextResponse.json({ error: "Unknown service area." }, { status: 400 });
  const division = applyOverrides(baseDivision, await getOverrides());

  const service = availableServices(division).find((s) => s.id === clean(body.service, 60));
  if (!service) return NextResponse.json({ error: "Please choose a service." }, { status: 400 });

  const contactName = clean(body.contactName, 120);
  const businessName = division.audience === "individual" ? contactName : clean(body.businessName, 160);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const engagement = clean(body.engagement, 20) === "recurring" ? "recurring" : "once-off";
  const turnaround = clean(body.turnaround, 120);
  const requirement = clean(body.requirement, 4000);

  if (!businessName || !contactName) {
    return NextResponse.json({ error: "Business and contact name are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!requirement) {
    return NextResponse.json({ error: "Please describe what you need." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Please agree to the privacy statement so we can contact you." }, { status: 400 });
  }

  // Division-specific fields: only accept what the catalogue defines.
  const details: Record<string, string> = {};
  for (const field of division.extraFields ?? []) {
    const raw = body.details?.[field.name];
    const value = Array.isArray(raw)
      ? raw
          .filter((v: unknown): v is string => typeof v === "string" && (field.options ?? []).includes(v))
          .join(", ")
      : clean(raw, 1000);
    if (field.required && !value) {
      return NextResponse.json({ error: `Please complete: ${field.label}.` }, { status: 400 });
    }
    if (value) details[field.label] = value;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Enquiries are temporarily unavailable. Please WhatsApp or email us." },
      { status: 503 }
    );
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("business_enquiries")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json({ error: "Too many enquiries. Please try again later or WhatsApp us." }, { status: 429 });
  }

  const reference = makeReference();
  const { error } = await admin.from("business_enquiries").insert({
    reference,
    division: division.slug,
    service: service.name,
    business_name: businessName,
    contact_name: contactName,
    email,
    phone: phone || null,
    engagement,
    turnaround: turnaround || null,
    requirement,
    details,
    consent_at: new Date().toISOString(),
    marketing_consent: body.marketing === true,
  });
  if (error) {
    console.error("business_enquiries insert failed", error);
    return NextResponse.json({ error: "We couldn't save your enquiry. Please try again." }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    const resend = new Resend(apiKey);
    const detailLines = Object.entries(details)
      .map(([k, v]) => `<strong>${esc(k)}:</strong> ${esc(v)}`)
      .join("<br>");
    try {
      await resend.emails.send({
        from,
        to: NOTIFY_TO,
        replyTo: email,
        subject: `New enquiry ${reference}: ${division.title} / ${service.name}`,
        html: `<p><strong>${esc(reference)}</strong></p>
<p><strong>Service:</strong> ${esc(division.title)} / ${esc(service.name)}<br>
<strong>Business:</strong> ${esc(businessName)}<br>
<strong>Contact:</strong> ${esc(contactName)} (${esc(email)}${phone ? `, ${esc(phone)}` : ""})<br>
<strong>Engagement:</strong> ${engagement}<br>
<strong>Turnaround:</strong> ${esc(turnaround || "not specified")}</p>
${detailLines ? `<p>${detailLines}</p>` : ""}
<p>${esc(requirement).replace(/\n/g, "<br>")}</p>`,
      });
    } catch (err) {
      console.error("enquiry team email failed", err);
    }
    try {
      await resend.emails.send({
        from,
        to: email,
        replyTo: NOTIFY_TO,
        subject: `We received your enquiry (${reference})`,
        html: `<p>Hi ${esc(contactName)},</p>
<p>Thank you for your enquiry about <strong>${esc(service.name)}</strong>. Your reference is <strong>${esc(reference)}</strong>.</p>
<p>A member of our team will review it and come back to you with next steps. For larger or custom work we will send a quotation for your approval before any work starts.</p>
<p>The Resume Document Hub<br>Single Point of Contact</p>`,
      });
    } catch (err) {
      console.error("enquiry acknowledgement email failed", err);
    }
  }

  return NextResponse.json({ reference });
}
