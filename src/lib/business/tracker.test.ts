import { describe, expect, it } from "vitest";
import type { BillingRow, StudioRequestRow } from "./format";
import { buildItems, hasMissReport, isMiss, itemsByStage, missStreak, reportOverdue, type EnquiryRow, type TargetResultRow } from "./tracker";

const now = new Date("2026-10-21T10:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

const enq = (o: Partial<EnquiryRow>): EnquiryRow => ({ id: "e1", reference: "ENQ-1", status: "new", business_name: "Acme", email: "a@acme.co.za", service: "HR support", created_at: daysAgo(0), ...o });
const bill = (o: Partial<BillingRow>): BillingRow => ({ id: "b1", request_id: null, client_email: "a@acme.co.za", client_name: "Acme", kind: "quote", number: "Q-1", description: "Work", amount_zar: 1000, status: "sent", due_date: null, created_at: daysAgo(0), ...o });
const req = (o: Partial<StudioRequestRow>): StudioRequestRow => ({ id: "r1", reference: "REQ-1", status: "new", document_type: "cv", template_style: "x", company_name: "Acme", contact_name: "A", email: "a@acme.co.za", phone: null, deadline: null, brief: null, files: [], created_at: daysAgo(0), ...o });
const run = (i: Partial<Parameters<typeof buildItems>[0]>) => buildItems({ enquiries: [], billing: [], requests: [], ...i }, now);
const res = (o: Partial<TargetResultRow>): TargetResultRow => ({ id: "x", target_id: "t", period_end: "2026-10-16", actual: 5, target_at_time: 10, note: null, miss_cause: null, miss_plan: null, miss_new_date: null, created_at: daysAgo(0), ...o });

describe("tracker stages", () => {
  it("flags an enquiry with no reply after a day", () => {
    expect(run({ enquiries: [enq({ created_at: daysAgo(0) })] })[0].flag).toBeNull();
    expect(run({ enquiries: [enq({ created_at: daysAgo(2) })] })[0].flag).toBe("No reply yet");
  });
  it("puts a sent quote in Quoted and flags it after 3 days", () => {
    const [i] = run({ billing: [bill({ created_at: daysAgo(4) })] });
    expect(i.stage).toBe("quoted");
    expect(i.flag).toBe("Follow up");
  });
  it("does not double count a quoted enquiry that has a platform quote", () => {
    const items = run({ enquiries: [enq({ status: "quoted" })], billing: [bill({})] });
    expect(items).toHaveLength(1);
  });
  it("moves an accepted quote under its request once work starts", () => {
    const items = run({ billing: [bill({ status: "accepted", request_id: "r1" })], requests: [req({ status: "in_progress" })] });
    expect(items.map((i) => i.stage)).toEqual(["delivery"]);
  });
  it("flags a request past its deadline", () => {
    expect(run({ requests: [req({ status: "in_progress", deadline: "2026-10-01" })] })[0].flag).toBe("Past deadline");
  });
  it("flags delivered work that has no invoice, and hides it once invoiced", () => {
    expect(run({ requests: [req({ status: "delivered" })] })[0].flag).toBe("Not invoiced");
    const items = run({ requests: [req({ status: "delivered" })], billing: [bill({ kind: "invoice", request_id: "r1", status: "sent" })] });
    expect(items.map((i) => i.stage)).toEqual(["invoiced"]);
  });
  it("flags an overdue invoice and keeps paid items for 30 days only", () => {
    expect(run({ billing: [bill({ kind: "invoice", due_date: "2026-10-01" })] })[0].flag).toBe("Overdue");
    expect(run({ billing: [bill({ kind: "invoice", status: "paid", paid_at: daysAgo(10) })] })).toHaveLength(1);
    expect(run({ billing: [bill({ kind: "invoice", status: "paid", paid_at: daysAgo(40) })] })).toHaveLength(0);
  });
  it("ignores lost, cancelled and declined business", () => {
    const items = run({ enquiries: [enq({ status: "lost" })], billing: [bill({ status: "declined" }), bill({ id: "b2", kind: "invoice", status: "cancelled" })], requests: [req({ status: "cancelled" })] });
    expect(items).toHaveLength(0);
  });
  it("groups items by stage, oldest first", () => {
    const g = itemsByStage(run({ enquiries: [enq({ id: "new", created_at: daysAgo(1) }), enq({ id: "old", created_at: daysAgo(5) })] }));
    expect(g.enquiry.map((i) => i.key)).toEqual(["enq-old", "enq-new"]);
  });
});

describe("target misses", () => {
  it("detects a miss and a complete report", () => {
    expect(isMiss(res({ actual: 5, target_at_time: 10 }))).toBe(true);
    expect(isMiss(res({ actual: 10, target_at_time: 10 }))).toBe(false);
    expect(hasMissReport(res({ miss_cause: "x", miss_plan: " " }))).toBe(false);
    expect(hasMissReport(res({ miss_cause: "x", miss_plan: "y" }))).toBe(true);
  });
  it("makes a report overdue after 24 hours without one", () => {
    expect(reportOverdue(res({ created_at: daysAgo(0) }), now)).toBe(false);
    expect(reportOverdue(res({ created_at: daysAgo(2) }), now)).toBe(true);
    expect(reportOverdue(res({ created_at: daysAgo(2), miss_cause: "c", miss_plan: "p" }), now)).toBe(false);
  });
  it("counts consecutive misses, newest first", () => {
    const rows = [
      res({ id: "1", period_end: "2026-10-02", actual: 12 }),
      res({ id: "2", period_end: "2026-10-09", actual: 3 }),
      res({ id: "3", period_end: "2026-10-16", actual: 4 }),
    ];
    expect(missStreak(rows)).toBe(2);
    expect(missStreak([res({ actual: 12 })])).toBe(0);
  });
});
