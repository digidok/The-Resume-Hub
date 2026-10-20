import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";
import { getDivision } from "@/lib/catalog/divisions";
import { formatZar, type BillingRow } from "@/lib/business/format";

export const metadata = { title: "Reports — The Resume Document Hub" };

export default async function ReportsPage() {
  const { supabase } = await requireAdminPage();
  const [{ data: enq }, { data: bills }, { data: fb }, { data: reqs }, { data: tasks }] = await Promise.all([
    supabase.from("business_enquiries").select("division, status, created_at"),
    supabase.from("business_billing").select("kind, status, amount_zar, paid_at, created_at"),
    supabase.from("business_feedback").select("rating"),
    supabase.from("studio_requests").select("status, approved_at"),
    supabase.from("business_tasks").select("status, due_date"),
  ]);

  const enquiries = (enq ?? []) as { division: string; status: string }[];
  const billing = (bills ?? []) as Pick<BillingRow, "kind" | "status" | "amount_zar" | "paid_at" | "created_at">[];
  const ratings = (fb ?? []) as { rating: number }[];
  const requests = (reqs ?? []) as { status: string; approved_at: string | null }[];
  const taskRows = (tasks ?? []) as { status: string; due_date: string | null }[];

  const won = enquiries.filter((e) => e.status === "won").length;
  const conversion = enquiries.length ? Math.round((won / enquiries.length) * 100) : 0;
  const byDivision = new Map<string, { total: number; won: number }>();
  for (const e of enquiries) {
    const d = byDivision.get(e.division) ?? { total: 0, won: 0 };
    d.total += 1;
    if (e.status === "won") d.won += 1;
    byDivision.set(e.division, d);
  }

  const paid = billing.filter((b) => b.kind === "invoice" && b.status === "paid");
  const outstanding = billing.filter((b) => b.kind === "invoice" && b.status === "sent");
  const quotesSent = billing.filter((b) => b.kind === "quote" && b.status !== "draft" && b.status !== "cancelled");
  const quotesAccepted = quotesSent.filter((b) => b.status === "accepted");
  const sum = (rows: typeof billing) => rows.reduce((s, b) => s + Number(b.amount_zar), 0);

  const months: { label: string; key: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" }), total: 0 });
  }
  for (const b of paid) {
    const d = new Date(b.paid_at ?? b.created_at);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.total += Number(b.amount_zar);
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.total));

  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : "—";
  const delivered = requests.filter((r) => r.status === "delivered");
  const approved = delivered.filter((r) => r.approved_at).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = taskRows.filter((t) => t.status !== "done" && t.due_date && t.due_date < today).length;

  const stat = (label: string, value: string, note?: string) => (
    <Card className="p-4">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </Card>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Revenue, conversion and delivery quality across business services.</p>
      <BusinessAdminNav />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Paid invoices", formatZar(sum(paid)), `${paid.length} invoices`)}
        {stat("Outstanding", formatZar(sum(outstanding)), `${outstanding.length} invoices`)}
        {stat("Enquiry to won", `${conversion}%`, `${won} of ${enquiries.length} enquiries`)}
        {stat("Quotes accepted", quotesSent.length ? `${Math.round((quotesAccepted.length / quotesSent.length) * 100)}%` : "—", `${quotesAccepted.length} of ${quotesSent.length}`)}
        {stat("Average rating", avgRating, `${ratings.length} reviews`)}
        {stat("Deliveries approved", delivered.length ? `${approved} of ${delivered.length}` : "—")}
        {stat("Overdue tasks", String(overdue))}
        {stat("Open requests", String(requests.filter((r) => r.status === "new" || r.status === "in_progress").length))}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Paid revenue, last six months</h2>
        <div className="mt-4 flex h-40 items-end gap-3">
          {months.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs text-slate-500">{m.total ? formatZar(m.total) : ""}</span>
              <div className="w-full rounded-t bg-brand-600" style={{ height: `${Math.max(2, (m.total / maxMonth) * 100)}%` }} />
              <span className="text-xs text-slate-500">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Enquiries by service area</h2>
        {byDivision.size === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No enquiries yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {[...byDivision.entries()].map(([slug, d]) => (
              <li key={slug} className="flex justify-between py-2">
                <span className="text-slate-800">{getDivision(slug)?.title ?? slug}</span>
                <span className="text-slate-500">
                  {d.total} enquiries · {d.won} won
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-6 text-sm text-slate-500">
        Automation failures are tracked on the{" "}
        <Link href="/dashboard/admin/errors" className="font-medium text-brand-600 hover:underline">
          errors page
        </Link>
        .
      </p>
    </div>
  );
}
