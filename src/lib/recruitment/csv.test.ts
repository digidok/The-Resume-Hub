import { describe, expect, it } from "vitest";
import { mapTalentCsv, parseCsv } from "./csv";

describe("csv", () => {
  it("handles quotes, commas and newlines in fields", () => {
    expect(parseCsv('a,b\n"x, y","he said ""hi"""\r\n')).toEqual([["a", "b"], ["x, y", 'he said "hi"']]);
  });
  it("maps headers and skips bad rows", () => {
    const r = mapTalentCsv(parseCsv("Full Name,Email,Skills\nThandi N,thandi@example.com,welding;rigging\n,x@example.com,a\nBad,not-an-email,b"));
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].full_name).toBe("Thandi N");
    expect(r.skipped.length).toBe(2);
  });
  it("reports missing columns", () => {
    expect(mapTalentCsv(parseCsv("foo,bar\n1,2")).missingColumns.length).toBeGreaterThan(0);
  });
});
