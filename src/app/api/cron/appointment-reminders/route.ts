import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSast } from "@/lib/appointments/slots";
import { TEAM_EMAIL, emailBody, esc, sendEmail } from "@/lib/business/notify";

// Runs once a day (see vercel.json) and reminds people of appointments in the next ~30 hours.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 3600 * 1000);
  const { data, error } = await admin
    .from("appointments")
    .select("id, reference, name, email, starts_at, manage_token, appointment_types(name)")
    .eq("status", "booked")
    .is("reminder_sent_at", null)
    .gt("starts_at", now.toISOString())
    .lte("starts_at", horizon.toISOString());
  if (error) {
    console.error("appointment reminders: query failed", error.message);
    return NextResponse.json({ error: "Reminder run failed." }, { status: 500 });
  }

  let sent = 0;
  for (const a of data ?? []) {
    const typeRow = Array.isArray(a.appointment_types) ? a.appointment_types[0] : a.appointment_types;
    const ok = await sendEmail({
      to: a.email,
      replyTo: TEAM_EMAIL,
      subject: `Reminder: your appointment on ${formatSast(a.starts_at)}`,
      html: emailBody(
        a.name,
        [
          `This is a reminder of your <strong>${esc(typeRow?.name ?? "appointment")}</strong> on <strong>${esc(formatSast(a.starts_at))}</strong> (South African time). Reference ${esc(a.reference)}.`,
          "If you can no longer make it, please cancel so someone else can use the time.",
        ],
        { path: `/book/manage/${a.manage_token}`, label: "Manage my appointment" }
      ),
    });
    if (ok) {
      await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", a.id);
      sent += 1;
    }
  }
  return NextResponse.json({ ok: true, checked: data?.length ?? 0, sent });
}
