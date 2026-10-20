import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTypes, getOpenSlots, makeManageToken, makeReference } from "@/lib/appointments/server";
import { formatSast, isOfferedSlot } from "@/lib/appointments/slots";
import { SITE_URL, TEAM_EMAIL, emailBody, esc, sendEmail } from "@/lib/business/notify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PER_DAY = 3;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Honeypot: real visitors never fill this in.
  if (clean(body.website, 100)) return NextResponse.json({ reference: "APT-000000", when: "" });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const topic = clean(body.topic, 200);
  const notes = clean(body.notes, 1500);
  const startIso = clean(body.start, 40);

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (body.consent !== true) {
    return NextResponse.json({ error: "Please agree to the privacy statement so we can contact you." }, { status: 400 });
  }
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return NextResponse.json({ error: "Please choose a time." }, { status: 400 });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Booking is temporarily unavailable. Please WhatsApp or email us." }, { status: 503 });
  }

  const type = (await getActiveTypes()).find((t) => t.slug === clean(body.type, 60));
  if (!type) return NextResponse.json({ error: "Please choose an appointment type." }, { status: 400 });

  // The chosen time must be one we actually offer right now (hours, notice period, blocks, existing bookings).
  const slots = await getOpenSlots(type);
  if (!isOfferedSlot(slots, start.toISOString())) {
    return NextResponse.json({ error: "That time is no longer available. Please pick another." }, { status: 409 });
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_DAY) {
    return NextResponse.json({ error: "Too many bookings from this email today. Please contact us." }, { status: 429 });
  }

  const end = new Date(start.getTime() + type.duration_minutes * 60_000);
  const reference = makeReference();
  const token = makeManageToken();
  const { error } = await admin.from("appointments").insert({
    reference,
    type_id: type.id,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    name,
    email,
    phone: phone || null,
    topic: topic || null,
    notes: notes || null,
    manage_token: token,
  });
  if (error) {
    // 23P01 = the no-overlap rule fired: someone else booked this slot a moment ago.
    if (error.code === "23P01") {
      return NextResponse.json({ error: "That time was just taken. Please pick another." }, { status: 409 });
    }
    console.error("appointment insert failed", error);
    return NextResponse.json({ error: "We couldn't save your booking. Please try again." }, { status: 500 });
  }

  const when = `${formatSast(start)} (South African time)`;
  await Promise.all([
    sendEmail({
      to: email,
      replyTo: TEAM_EMAIL,
      subject: `Your appointment is booked (${reference})`,
      html: emailBody(
        name,
        [
          `Your <strong>${esc(type.name)}</strong> is booked for <strong>${esc(when)}</strong> (${type.duration_minutes} minutes).`,
          `Your reference is <strong>${esc(reference)}</strong>. If you need to cancel or change the time, use the link below.`,
        ],
        { path: `/book/manage/${token}`, label: "Manage my appointment" }
      ),
    }),
    sendEmail({
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `New appointment ${reference}: ${type.name}, ${formatSast(start)}`,
      html: `<p><strong>${esc(reference)}</strong> · ${esc(type.name)}<br><strong>When:</strong> ${esc(when)}<br><strong>Who:</strong> ${esc(name)} (${esc(email)}${phone ? `, ${esc(phone)}` : ""})${topic ? `<br><strong>Topic:</strong> ${esc(topic)}` : ""}</p>${notes ? `<p>${esc(notes).replace(/\n/g, "<br>")}</p>` : ""}<p><a href="${SITE_URL}/dashboard/admin/business/appointments">Open appointments</a></p>`,
    }),
  ]);

  return NextResponse.json({ reference, when, manageUrl: `/book/manage/${token}` });
}
