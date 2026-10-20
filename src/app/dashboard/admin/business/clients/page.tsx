import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";
import { formatZar, type BillingRow, type RetainerRow, type StudioRequestRow } from "@/lib/business/format";

export const metadata = { title: "Clients — The Resume Document Hub" };

type Row = { email: string; name: string; requests: number; open: number; paid: number; outstanding: number; retainers: number };

export default async function ClientsPage() {
  const { supabase } = await requireAdminPage();
  const [{ data: reqs }, { data: bills }, { data: rets }] = await Promise.all([
    supabase.from("studio_requests").select("email, company_name, status"),
    supabase.from("business_billing").select("client_email, client_name, kind, status, amount_zar"),
    supabase.from("business_retainers").select("client_email, company_name, active"),
  ]);

  const map = new Map<string, Row>();
  const row = (email: string, name: string) => {
    const key = email.toLowerCase();
    if (!map.has(key)) map.set(key, { email: key, name, requests: 0, open: 0, paid: 0, outstanding: 0, retainers: 0 });
    return map.get(key)!;
  };
  for (const r of (reqs ?? []) as Pick<StudioRequestRow, "email" | "company_name" | "status">[]) {
    const x = row(r.email, r.company_name);
    x.requests += 1;
    if (r.status === "new" || r.status === "in_progress") x.open += 1;
  }
  for (const b of (bills ?? []) as Pick<BillingRow, "client_email" | "client_name" | "kind" | "status" | "amount_zar">[]) {
    const x = row(b.client_email, b.client_name);
    if (b.kind === "invoice" && b.status === "paid") x.paid += Number(b.amount_zar);
    if (b.kind === "invoice" && b.status === "sent") x.outstanding += Number(b.amount_zar);
  }
  for (const r of (rets ?? []) as Pick<RetainerRow, "client_email" | "company_name" | "active">[]) {
    const x = row(r.client_email, r.company_name);
    if (r.active) x.retainers += 1;
  }
  const rows = [...map.values()].sort((a, b) => b.paid + b.outstanding - (a.paid + a.outstanding));

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Every business client in one list, from requests, billing and retainers.</p>
      <BusinessAdminNav />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Client</th>
              <th className="px-3 py-3">Requests</th>
              <th className="px-3 py-3">Open</th>
              <th className="px-3 py-3">Retainers</th>
              <th className="px-3 py-3">Outstanding</th>
              <th className="px-5 py-3">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-slate-500">
                  No clients yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.email}>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </td>
                <td className="px-3 py-3">{r.requests}</td>
                <td className="px-3 py-3">{r.open}</td>
                <td className="px-3 py-3">{r.retainers}</td>
                <td className="px-3 py-3">{formatZar(r.outstanding)}</td>
                <td className="px-5 py-3 font-medium">{formatZar(r.paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
