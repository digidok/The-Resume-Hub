import { describe, expect, it } from "vitest";
import { formatSast, generateSlots, isOfferedSlot, sastDate, sastToUtc, upcomingDates, weekdayOf } from "./slots";

// 2026-10-21 is a Wednesday.
const base = {
  now: new Date("2026-10-20T06:00:00Z"),
  dates: ["2026-10-21"],
  durationMinutes: 30,
  windows: [{ weekday: 3, start: "09:00", end: "11:00" }],
  blocks: [],
  booked: [],
};

describe("slots", () => {
  it("converts SAST to UTC (UTC+2)", () => {
    expect(sastToUtc("2026-10-21", 9 * 60).toISOString()).toBe("2026-10-21T07:00:00.000Z");
  });
  it("finds weekday and SAST date", () => {
    expect(weekdayOf("2026-10-21")).toBe(3);
    expect(sastDate(new Date("2026-10-20T23:30:00Z"))).toBe("2026-10-21");
    expect(upcomingDates(new Date("2026-10-20T10:00:00Z"), 3)).toEqual(["2026-10-20", "2026-10-21", "2026-10-22"]);
  });
  it("generates slots inside the window", () => {
    expect(generateSlots(base)["2026-10-21"]).toHaveLength(4);
  });
  it("skips booked and blocked times", () => {
    const booked = [{ start: new Date("2026-10-21T07:00:00Z"), end: new Date("2026-10-21T07:30:00Z") }];
    const blocks = [{ start: new Date("2026-10-21T08:00:00Z"), end: new Date("2026-10-21T09:00:00Z") }];
    expect(generateSlots({ ...base, booked, blocks })["2026-10-21"]).toEqual(["2026-10-21T07:30:00.000Z"]);
  });
  it("applies minimum notice", () => {
    const slots = generateSlots({ ...base, now: new Date("2026-10-21T06:00:00Z"), minNoticeHours: 4 })["2026-10-21"];
    expect(slots).toEqual([]);
  });
  it("applies buffers between appointments", () => {
    const booked = [{ start: new Date("2026-10-21T07:00:00Z"), end: new Date("2026-10-21T07:30:00Z") }];
    const slots = generateSlots({ ...base, booked, bufferMinutes: 30 })["2026-10-21"];
    expect(slots).not.toContain("2026-10-21T07:30:00.000Z");
  });
  it("gives nothing on days without a window", () => {
    expect(generateSlots({ ...base, dates: ["2026-10-22"] })["2026-10-22"]).toEqual([]);
  });
  it("validates offered slots and formats time", () => {
    const s = generateSlots(base);
    expect(isOfferedSlot(s, "2026-10-21T07:00:00.000Z")).toBe(true);
    expect(isOfferedSlot(s, "2026-10-21T07:15:00.000Z")).toBe(false);
    expect(formatSast("2026-10-21T07:00:00Z")).toBe("Wed 21 Oct, 09:00");
  });
});
