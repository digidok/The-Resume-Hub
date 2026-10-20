import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSast } from "@/lib/appointments/slots";
import { TEAM_EMAIL, emailBody, esc, sendEmail } from "@/lib/business/notify";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.slice(0, 80) : "";
  if (!token) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const admin = createAdminClient();
  const { data: appt } = await admin
    .from("appointments")
    .select("id, reference, name, email, starts_at, status, appointment_types(name)")
    .eq("manage_token", token)
    .maybeSingle();
  if (!appt) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  if (appt.status !== "booked") return NextResponse.json({ error: "This appointment is already closed." }, { status: 409 });
  if (new Date(appt.starts_at) < new Date()) {
    return NextResponse.json({ error: "This appointment has already passed." }, { status: 409 });
  }

  const { error } = await admin.from("appointments").update({ status: "cancelled" }).eq("id", appt.id).eq("status", "booked");
  if (error) return NextResponse.json({ error: "Could not cancel. Please contact us." }, { status: 500 });

  const typeRow = Array.isArray(appt.appointment_types) ? appt.appointment_types[0] : appt.appointment_types;
  const when = formatSast(appt.starts_at);
  await Promise.all([
    sendEmail({
      to: appt.email,
      replyTo: TEAM_EMAIL,
      subject: `Your appointment was cancelled (${appt.reference})`,
      html: emailBody(appt.name, [
        `Your ${esc(typeRow?.name ?? "appointment")} on ${esc(when)} was cancelled. You can book a new time whenever you like.`,
      ], { path: "/book", label: "Book a new time" }),
    }),
    sendEmail({
      to: TEAM_EMAIL,
      subject: `Appointment cancelled ${appt.reference}`,
      html: `<p>${esc(appt.name)} (${esc(appt.email)}) cancelled their ${esc(typeRow?.name ?? "appointment")} on ${esc(when)}.</p>`,
    }),
  ]);
  return NextResponse.json({ ok: true });
}
