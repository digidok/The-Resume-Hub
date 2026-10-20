import { describe, expect, it } from "vitest";
import { ALL_DIVISIONS, availableServices, formatPrice } from "./divisions";
import { SERVICE_DETAILS } from "./details";

describe("catalogue", () => {
  it("lists services cheapest first, quotes last", () => {
    for (const d of ALL_DIVISIONS) {
      const prices = availableServices(d).map((s) => s.fromZar ?? Infinity);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    }
  });
  it("has a description for every service", () => {
    for (const d of ALL_DIVISIONS) {
      for (const s of d.services) expect(SERVICE_DETAILS[s.id], `${d.slug}/${s.id}`).toBeDefined();
    }
  });
  it("has unique service ids", () => {
    const ids = ALL_DIVISIONS.flatMap((d) => d.services.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("formats prices", () => {
    expect(formatPrice({ id: "x", name: "x", description: "", models: ["quote"] })).toBe("Request a quote");
    expect(formatPrice({ id: "x", name: "x", description: "", models: ["monthly"], fromZar: 1500 })).toMatch(/^From R1.500\/month$/);
  });
});
