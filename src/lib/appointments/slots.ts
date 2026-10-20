// Pure slot logic for appointment booking (no database access), so it can be unit tested.
// South Africa has no daylight saving: local time is always UTC+2.

export const SAST_OFFSET_MINUTES = 120;
const MIN = 60_000;

export type Window = { weekday: number; start: string; end: string }; // "HH:MM" or "HH:MM:SS", SAST
export type Interval = { start: Date; end: Date };

export type SlotOptions = {
  now: Date;
  /** Local (SAST) dates to generate for, as "YYYY-MM-DD". */
  dates: string[];
  durationMinutes: number;
  windows: Window[];
  blocks: Interval[];
  booked: Interval[];
  /** Earliest bookable time after `now`. */
  minNoticeHours?: number;
  /** Gap kept between appointments. */
  bufferMinutes?: number;
  /** How often a slot can start (defaults to the duration). */
  stepMinutes?: number;
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

/** UTC instant for a SAST wall-clock date and minutes-since-midnight. */
export function sastToUtc(date: string, minutesSinceMidnight: number): Date {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 0, minutesSinceMidnight - SAST_OFFSET_MINUTES, 0, 0));
}

/** Weekday (0 = Sunday) of a "YYYY-MM-DD" date. */
export function weekdayOf(date: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** Today's date in SAST as "YYYY-MM-DD". */
export function sastDate(instant: Date): string {
  return new Date(instant.getTime() + SAST_OFFSET_MINUTES * MIN).toISOString().slice(0, 10);
}

/** The next `count` SAST dates starting from the date of `now`. */
export function upcomingDates(now: Date, count: number): string[] {
  const out: string[] = [];
  const start = sastDate(now);
  const [y, mo, d] = start.split("-").map(Number);
  for (let i = 0; i < count; i++) {
    out.push(new Date(Date.UTC(y, mo - 1, d + i)).toISOString().slice(0, 10));
  }
  return out;
}

function overlaps(aStart: Date, aEnd: Date, b: Interval): boolean {
  return aStart < b.end && aEnd > b.start;
}

/** Returns bookable slot start times (UTC ISO strings), grouped by SAST date. */
export function generateSlots(opts: SlotOptions): Record<string, string[]> {
  const step = opts.stepMinutes ?? opts.durationMinutes;
  const buffer = opts.bufferMinutes ?? 0;
  const earliest = new Date(opts.now.getTime() + (opts.minNoticeHours ?? 4) * 60 * MIN);
  const result: Record<string, string[]> = {};

  for (const date of opts.dates) {
    const dayWindows = opts.windows.filter((w) => w.weekday === weekdayOf(date));
    const slots: string[] = [];
    for (const w of dayWindows) {
      const endMin = toMinutes(w.end);
      for (let t = toMinutes(w.start); t + opts.durationMinutes <= endMin; t += step) {
        const start = sastToUtc(date, t);
        const end = new Date(start.getTime() + opts.durationMinutes * MIN);
        if (start < earliest) continue;
        const guardStart = new Date(start.getTime() - buffer * MIN);
        const guardEnd = new Date(end.getTime() + buffer * MIN);
        if (opts.blocks.some((b) => overlaps(start, end, b))) continue;
        if (opts.booked.some((b) => overlaps(guardStart, guardEnd, b))) continue;
        slots.push(start.toISOString());
      }
    }
    result[date] = Array.from(new Set(slots)).sort();
  }
  return result;
}

/** True when `startIso` is one of the offered slots, used to re-validate on booking. */
export function isOfferedSlot(slots: Record<string, string[]>, startIso: string): boolean {
  return Object.values(slots).some((list) => list.includes(startIso));
}

/** Human-readable SAST time, e.g. "Wed 21 Oct, 09:30". */
export function formatSast(instant: Date | string): string {
  const d = new Date(typeof instant === "string" ? instant : instant.getTime());
  const local = new Date(d.getTime() + SAST_OFFSET_MINUTES * MIN);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return `${days[local.getUTCDay()]} ${local.getUTCDate()} ${months[local.getUTCMonth()]}, ${hh}:${mm}`;
}
