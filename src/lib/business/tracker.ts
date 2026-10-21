// Pure stage logic for the business tracker (no database access) so it can be unit tested.
// Every open piece of business sits in exactly one stage, from enquiry to paid.

import type { BillingRow, StudioRequestRow } from "@/lib/business/format";

export type Stage = "enquiry" | "quoted" | "accepted" | "delivery" | "delivered" | "invoiced" | "paid";

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "enquiry", label: "Enquiry", hint: "New or contacted, no quote yet" },
  { id: "quoted", label: "Quoted", hint: "Quote sent, waiting for a yes" },
  { id: "accepted", label: "Accepted", hint: "Client said yes, work not started" },
  { id: "delivery", label: "In delivery", hint: "Work under way" },
  { id: "delivered", label: "Delivered", hint: "Done, not yet invoiced" },
  { id: "invoiced", label: "Invoiced", hint: "Invoice sent, waiting for payment" },
  { id: "paid", label: "Paid", hint: "Paid in the last 30 days" },
];

export type EnquiryRow = {
  id: string;
  reference: string;
  status: string;
  business_name: string;
  email: string;
  service: string;
  created_at: string;
};

export type TrackerItem = {
  key: string;
  stage: Stage;
  title: string;
  detail: string;
  amount: number | null;
  since: string;
  href: string;
  flag: string | null;
};

const DAY = 86_400_000;

export function ageDays(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY));
}

function isPast(date: string | null, now: Date): boolean {
  if (!date) return false;
  return date < now.toISOString().slice(0, 10);
}

/** Turns the raw rows into one tracker item each, with a flag when something needs action. */
export function buildItems(
  input: { enquiries: EnquiryRow[]; billing: BillingRow[]; requests: StudioRequestRow[] },
  now: Date
): TrackerItem[] {
  const items: TrackerItem[] = [];
  const requestById = new Map(input.requests.map((r) => [r.id, r]));
  const invoicedRequests = new Set(
    input.billing.filter((b) => b.kind === "invoice" && b.status !== "cancelled" && b.request_id).map((b) => b.request_id as string)
  );
  const quotedEmails = new Set(
    input.billing.filter((b) => b.kind === "quote" && (b.status === "sent" || b.status === "accepted")).map((b) => b.client_email.toLowerCase())
  );

  for (const e of input.enquiries) {
    const age = ageDays(e.created_at, now);
    if (e.status === "new" || e.status === "contacted") {
      items.push({
        key: `enq-${e.id}`,
        stage: "enquiry",
        title: e.business_name,
        detail: `${e.service} · ${e.reference}`,
        amount: null,
        since: e.created_at,
        href: "/dashboard/admin/business/enquiries",
        flag: e.status === "new" && age >= 1 ? "No reply yet" : e.status === "contacted" && age >= 3 ? "Send the quote" : null,
      });
    } else if (e.status === "quoted" && !quotedEmails.has(e.email.toLowerCase())) {
      items.push({
        key: `enq-${e.id}`,
        stage: "quoted",
        title: e.business_name,
        detail: `${e.service} · quoted outside the platform`,
        amount: null,
        since: e.created_at,
        href: "/dashboard/admin/business/enquiries",
        flag: age >= 3 ? "Follow up" : null,
      });
    }
  }

  for (const b of input.billing) {
    const age = ageDays(b.created_at, now);
    const link = b.request_id ? `/dashboard/admin/business/${requestById.get(b.request_id)?.reference ?? ""}` : "/dashboard/admin/business";
    if (b.kind === "quote" && b.status === "sent") {
      items.push({ key: `bill-${b.id}`, stage: "quoted", title: b.client_name, detail: `${b.number} · ${b.description}`, amount: Number(b.amount_zar), since: b.created_at, href: link, flag: age >= 3 ? "Follow up" : null });
    } else if (b.kind === "quote" && b.status === "accepted") {
      const req = b.request_id ? requestById.get(b.request_id) : undefined;
      if (req && (req.status === "in_progress" || req.status === "delivered")) continue; // shown under its request
      items.push({ key: `bill-${b.id}`, stage: "accepted", title: b.client_name, detail: `${b.number} · ${b.description}`, amount: Number(b.amount_zar), since: b.created_at, href: link, flag: age >= 1 ? "Start the work" : null });
    } else if (b.kind === "invoice" && b.status === "sent") {
      items.push({ key: `bill-${b.id}`, stage: "invoiced", title: b.client_name, detail: `${b.number} · ${b.description}`, amount: Number(b.amount_zar), since: b.created_at, href: link, flag: isPast(b.due_date, now) ? "Overdue" : null });
    } else if (b.kind === "invoice" && b.status === "paid") {
      const paidAt = b.paid_at ?? b.created_at;
      if (ageDays(paidAt, now) <= 30) {
        items.push({ key: `bill-${b.id}`, stage: "paid", title: b.client_name, detail: `${b.number} · ${b.description}`, amount: Number(b.amount_zar), since: paidAt, href: link, flag: null });
      }
    }
  }

  for (const r of input.requests) {
    const age = ageDays(r.created_at, now);
    const href = `/dashboard/admin/business/${r.reference}`;
    if (r.status === "new" || r.status === "in_progress") {
      const late = isPast(r.deadline, now);
      items.push({
        key: `req-${r.id}`,
        stage: "delivery",
        title: r.company_name,
        detail: `${r.reference}${r.deadline ? ` · due ${r.deadline}` : ""}`,
        amount: null,
        since: r.created_at,
        href,
        flag: late ? "Past deadline" : r.status === "new" && age >= 1 ? "Not started" : null,
      });
    } else if (r.status === "delivered" && !invoicedRequests.has(r.id)) {
      items.push({ key: `req-${r.id}`, stage: "delivered", title: r.company_name, detail: r.reference, amount: null, since: r.created_at, href, flag: "Not invoiced" });
    }
  }

  return items;
}

export function itemsByStage(items: TrackerItem[]): Record<Stage, TrackerItem[]> {
  const out = Object.fromEntries(STAGES.map((s) => [s.id, [] as TrackerItem[]])) as Record<Stage, TrackerItem[]>;
  for (const it of items) out[it.stage].push(it);
  for (const s of STAGES) out[s.id].sort((a, b) => a.since.localeCompare(b.since));
  return out;
}

// --- Weekly targets ---------------------------------------------------------------

export type TargetRow = {
  id: string;
  area: string;
  measure: string;
  unit: "count" | "zar" | "percent";
  period: "week" | "month";
  target: number;
  owner_name: string;
  active: boolean;
};

export type TargetResultRow = {
  id: string;
  target_id: string;
  period_end: string;
  actual: number;
  target_at_time: number;
  note: string | null;
  miss_cause: string | null;
  miss_plan: string | null;
  miss_new_date: string | null;
  created_at: string;
};

export function isMiss(r: Pick<TargetResultRow, "actual" | "target_at_time">): boolean {
  return Number(r.actual) < Number(r.target_at_time);
}

export function hasMissReport(r: Pick<TargetResultRow, "miss_cause" | "miss_plan">): boolean {
  return Boolean(r.miss_cause?.trim()) && Boolean(r.miss_plan?.trim());
}

/** A miss is "report overdue" once 24 hours have passed with no cause and plan written down. */
export function reportOverdue(r: TargetResultRow, now: Date): boolean {
  return isMiss(r) && !hasMissReport(r) && now.getTime() - new Date(r.created_at).getTime() > DAY;
}

/** Number of results in a row, newest first, that missed this target. */
export function missStreak(results: TargetResultRow[]): number {
  const sorted = [...results].sort((a, b) => b.period_end.localeCompare(a.period_end));
  let n = 0;
  for (const r of sorted) {
    if (!isMiss(r)) break;
    n += 1;
  }
  return n;
}

export function formatTargetValue(value: number, unit: TargetRow["unit"]): string {
  if (unit === "zar") return `R${Number(value).toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;
  if (unit === "percent") return `${Number(value)}%`;
  return String(Number(value));
}
