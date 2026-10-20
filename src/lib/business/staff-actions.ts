"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { requireAdminPage, requireStaff, type StaffRole } from "@/lib/business/guard";
import { formatSast } from "@/lib/appointments/slots";
import { TEAM_EMAIL, emailBody, esc, sendEmail } from "@/lib/business/notify";

const APPOINTMENT_ROLES: StaffRole[] = ["consultant", "recruiter"];
const APPOINTMENT_STATUSES = ["booked", "completed", "cancelled", "no_show"] as const;
const STAFF_ROLES: StaffRole[] = ["recruiter", "consultant", "payroll", "delivery"];

function text(form: FormData, key: string, max: number): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

async function audit(
  { supabase, user }: { supabase: SupabaseClient; user: User },
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {}
) {
  try {
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action,
      entity,
      entity_id: entityId,
      meta,
    });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}

// --- Appointments ---------------------------------------------------------------

export async function setAppointmentStatus(id: string, status: string) {
  if (!(APPOINTMENT_STATUSES as readonly string[]).includes(status)) return;
  const staff = await requireStaff(APPOINTMENT_ROLES);
  const { data: appt } = await staff.supabase
    .from("appointments")
    .select("reference, name, email, starts_at, appointment_types(name)")
    .eq("id", id)
    .maybeSingle();
  const { error } = await staff.supabase.from("appointments").update({ status }).eq("id", id);
  if (error) return;
  await audit(staff, "appointment.status", "appointment", id, { status });
  if (status === "cancelled" && appt) {
    const typeRow = Array.isArray(appt.appointment_types) ? appt.appointment_types[0] : appt.appointment_types;
    await sendEmail({
      to: appt.email,
      replyTo: TEAM_EMAIL,
      subject: `Your appointment was cancelled (${appt.reference})`,
      html: emailBody(appt.name, [
        `We had to cancel your ${esc(typeRow?.name ?? "appointment")} on ${esc(formatSast(appt.starts_at))}. We are sorry for the inconvenience. Please book a new time that suits you.`,
      ], { path: "/book", label: "Book a new time" }),
    });
  }
  revalidatePath("/dashboard/admin/business/appointments");
}

export async function addAvailabilityWindow(form: FormData) {
  const staff = await requireStaff(APPOINTMENT_ROLES);
  const weekday = Number(text(form, "weekday", 1));
  const start = text(form, "start_time", 5);
  const end = text(form, "end_time", 5);
  if (!(weekday >= 0 && weekday <= 6) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) return;
  await staff.supabase.from("availability_windows").insert({ weekday, start_time: start, end_time: end });
  await audit(staff, "availability.add", "availability_window", null, { weekday, start, end });
  revalidatePath("/dashboard/admin/business/appointments/availability");
}

export async function removeAvailabilityWindow(id: string) {
  const staff = await requireStaff(APPOINTMENT_ROLES);
  await staff.supabase.from("availability_windows").delete().eq("id", id);
  await audit(staff, "availability.remove", "availability_window", id);
  revalidatePath("/dashboard/admin/business/appointments/availability");
}

export async function addAvailabilityBlock(form: FormData) {
  const staff = await requireStaff(APPOINTMENT_ROLES);
  const from = text(form, "from", 10);
  const to = text(form, "to", 10) || from;
  const reason = text(form, "reason", 200);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) return;
  // Whole days in South African time: 00:00 on the first day to 24:00 on the last.
  const starts = new Date(`${from}T00:00:00+02:00`);
  const ends = new Date(new Date(`${to}T00:00:00+02:00`).getTime() + 24 * 3600 * 1000);
  await staff.supabase.from("availability_blocks").insert({ starts_at: starts.toISOString(), ends_at: ends.toISOString(), reason: reason || null });
  await audit(staff, "availability.block", "availability_block", null, { from, to, reason });
  revalidatePath("/dashboard/admin/business/appointments/availability");
}

export async function removeAvailabilityBlock(id: string) {
  const staff = await requireStaff(APPOINTMENT_ROLES);
  await staff.supabase.from("availability_blocks").delete().eq("id", id);
  await audit(staff, "availability.unblock", "availability_block", id);
  revalidatePath("/dashboard/admin/business/appointments/availability");
}

export async function setAppointmentTypeActive(id: string, active: boolean) {
  const staff = await requireStaff(APPOINTMENT_ROLES);
  await staff.supabase.from("appointment_types").update({ active }).eq("id", id);
  await audit(staff, "appointment_type.active", "appointment_type", id, { active });
  revalidatePath("/dashboard/admin/business/appointments/availability");
}

// --- Staff members (administrators only) ----------------------------------------

export async function addStaffMember(form: FormData) {
  const admin = await requireAdminPage();
  const email = text(form, "email", 200).toLowerCase();
  const role = text(form, "staff_role", 20) as StaffRole;
  if (!email || !STAFF_ROLES.includes(role)) return;
  // Look the person up by email through their profile (they must already have an account).
  const { data: userId } = await admin.supabase.rpc("find_user_id_by_email", { p_email: email });
  if (!userId) return;
  await admin.supabase.from("staff_members").upsert({ user_id: userId, staff_role: role });
  await audit(admin, "staff.add", "staff_member", userId as string, { role });
  revalidatePath("/dashboard/admin/business/staff");
}

export async function removeStaffMember(userId: string, role: string) {
  const admin = await requireAdminPage();
  await admin.supabase.from("staff_members").delete().eq("user_id", userId).eq("staff_role", role);
  await audit(admin, "staff.remove", "staff_member", userId, { role });
  revalidatePath("/dashboard/admin/business/staff");
}
