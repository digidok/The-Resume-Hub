import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlots, upcomingDates, type Interval, type Window } from "@/lib/appointments/slots";

export const BOOKING_DAYS_AHEAD = 21;
export const MIN_NOTICE_HOURS = 4;

export type AppointmentType = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
};

export async function getActiveTypes(): Promise<AppointmentType[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointment_types")
    .select("id, slug, name, description, duration_minutes")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as AppointmentType[];
}

/** Open slots for one appointment type over the booking horizon, grouped by SAST date. */
export async function getOpenSlots(type: AppointmentType, now = new Date()): Promise<Record<string, string[]>> {
  const admin = createAdminClient();
  const dates = upcomingDates(now, BOOKING_DAYS_AHEAD);
  const horizonEnd = new Date(now.getTime() + (BOOKING_DAYS_AHEAD + 1) * 86_400_000).toISOString();

  const [{ data: windows }, { data: blocks }, { data: booked }] = await Promise.all([
    admin.from("availability_windows").select("weekday, start_time, end_time"),
    admin.from("availability_blocks").select("starts_at, ends_at").lte("starts_at", horizonEnd),
    admin
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("status", "booked")
      .gte("ends_at", now.toISOString())
      .lte("starts_at", horizonEnd),
  ]);

  const toIntervals = (rows: { starts_at: string; ends_at: string }[] | null): Interval[] =>
    (rows ?? []).map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) }));

  return generateSlots({
    now,
    dates,
    durationMinutes: type.duration_minutes,
    windows: ((windows ?? []) as { weekday: number; start_time: string; end_time: string }[]).map(
      (w): Window => ({ weekday: w.weekday, start: w.start_time, end: w.end_time })
    ),
    blocks: toIntervals(blocks),
    booked: toIntervals(booked),
    minNoticeHours: MIN_NOTICE_HOURS,
  });
}

export function makeReference(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `APT-${out}`;
}

export function makeManageToken(): string {
  return randomBytes(24).toString("base64url");
}
