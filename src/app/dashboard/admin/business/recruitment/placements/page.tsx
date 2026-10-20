import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { RecruitmentNav } from "@/components/business/recruitment-nav";
import { requireStaff } from "@/lib/business/guard";
import { addTimesheet, approveTimesheet, createPlacement, endPlacement } from "@/lib/business/recruitment-actions";
import { formatZar } from "@/lib/business/format";

export const metadata = { title: "Placements and payroll — The Resume Document Hub" };
export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const UNIT: Record<string, string> = { hourly: "hours", daily: "days", monthly: "months" };

type Placement = {
  id: string;
  client_name: string;
  role_title: string;
  start_date: string;
  end_date: string | null;
  pay_basis: string;
  pay_rate: number;
  bill_rate: number;
  status: string;
  talent_pool: { full_name: string } | { full_name: string }[] | null;
};
type Sheet = { id: string; placement_id: string; week_ending: string; units: number; approved: boolean };

export default async function PlacementsPage() {
  const { supabase } = await requireStaff(["recruiter", "payroll"]);
  const [{ data: placementData }, { data: sheetData }, { data: people }] = await Promise.all([
    supabase.from("placements").select("id, client_name, role_title, start_date, end_date, pay_basis, pay_rate, bill_rate, status, talent_pool(full_name)").order("created_at", { ascending: false }).limit(300),
    supabase.from("placement_timesheets").select("id, placement_id, week_ending, units, approved").order("week_ending", { ascending: false }).limit(3000),
    supabase.from("vacancy_candidates").select("talent_id, talent_pool(full_name), vacancies(id, client_name, title)").in("stage", ["offered", "placed"]).limit(500),
  ]);
  const placements = (placementData ?? []) as unknown as Placement[];
  const sheets = (sheetData ?? []) as Sheet[];

  const totals = placements.reduce(
    (acc, p) => {
      for (const s of sheets.filter((x) => x.placement_id === p.id && x.approved)) {
        acc.pay += s.units * p.pay_rate;
        acc.bill += s.units * p.bill_rate;
      }
      return acc;
    },
    { pay: 0, bill: 0 }
  );

  type Cand = { talent_id: string; talent_pool: { full_name: string } | { full_name: string }[] | null; vacancies: { id: string; client_name: string; title: string } | { id: string; client_name: string; title: string }[] | null };
  const candidates = ((people ?? []) as unknown as Cand[]).map((c) => ({
    talent_id: c.talent_id,
    name: (Array.isArray(c.talent_pool) ? c.talent_pool[0] : c.talent_pool)?.full_name ?? "Candidate",
    vacancy: Array.isArray(c.vacancies) ? c.vacancies[0] : c.vacancies,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        People we employ and place with clients: pay and bill rates, weekly units worked and approved totals. This prepares payroll
        inputs; it does not run payroll.
      </p>
      <BusinessAdminNav />
      <RecruitmentNav />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Approved pay to staff</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatZar(totals.pay)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Approved billing to clients</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatZar(totals.bill)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Margin</p><p className="mt-1 text-2xl font-bold text-emerald-700">{formatZar(totals.bill - totals.pay)}</p></Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New placement</h2>
        {candidates.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Move candidates to <strong>Offered</strong> or <strong>Placed</strong> in a vacancy to place them here.</p>
        ) : (
          <form action={createPlacement} className="mt-3 grid gap-3 sm:grid-cols-3">
            <select name="talent_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>Candidate</option>
              {candidates.map((c) => (
                <option key={`${c.talent_id}-${c.vacancy?.id}`} value={c.talent_id}>{c.name} · {c.vacancy?.title}</option>
              ))}
            </select>
            <input name="client_name" required maxLength={160} placeholder="Client" className={inputCls} />
            <input name="role_title" required maxLength={200} placeholder="Role" className={inputCls} />
            <input name="start_date" type="date" required aria-label="Start date" className={inputCls} />
            <input name="end_date" type="date" aria-label="End date" className={inputCls} />
            <select name="pay_basis" defaultValue="hourly" className={inputCls}>
              <option value="hourly">Paid per hour</option>
              <option value="daily">Paid per day</option>
              <option value="monthly">Paid per month</option>
            </select>
            <input name="pay_rate" type="number" step="0.01" min={0} required placeholder="Pay rate to worker (R)" className={inputCls} />
            <input name="bill_rate" type="number" step="0.01" min={0} required placeholder="Bill rate to client (R)" className={inputCls} />
            <div><Button type="submit">Create placement</Button></div>
          </form>
        )}
      </Card>

      <div className="mt-6 space-y-4">
        {placements.length === 0 && <p className="text-sm text-slate-500">No placements yet.</p>}
        {placements.map((p) => {
          const who = Array.isArray(p.talent_pool) ? p.talent_pool[0] : p.talent_pool;
          const mine = sheets.filter((s) => s.placement_id === p.id);
          return (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{who?.full_name} <span className="font-normal text-slate-500">· {p.role_title} at {p.client_name}</span></p>
                  <p className="text-xs text-slate-500">
                    From {p.start_date}{p.end_date ? ` to ${p.end_date}` : ""} · pays {formatZar(p.pay_rate)} / {UNIT[p.pay_basis].slice(0, -1)}, bills {formatZar(p.bill_rate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${p.status === "active" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                  {p.status === "active" && (
                    <form action={endPlacement.bind(null, p.id)}><button className="text-xs font-medium text-red-600 hover:underline">End placement</button></form>
                  )}
                </div>
              </div>
              {p.status === "active" && (
                <form action={addTimesheet} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="placement_id" value={p.id} />
                  <label className="text-xs text-slate-500">Week ending<input name="week_ending" type="date" required className={`${inputCls} mt-1`} /></label>
                  <label className="text-xs text-slate-500">{UNIT[p.pay_basis]} worked<input name="units" type="number" step="0.25" min={0} required className={`${inputCls} mt-1`} /></label>
                  <Button type="submit" variant="outline">Save timesheet</Button>
                </form>
              )}
              {mine.length > 0 && (
                <ul className="mt-3 divide-y divide-slate-100 text-sm">
                  {mine.slice(0, 8).map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-1.5">
                      <span className="text-slate-700">Week ending {s.week_ending}: {s.units} {UNIT[p.pay_basis]} · pay {formatZar(s.units * p.pay_rate)} · bill {formatZar(s.units * p.bill_rate)}</span>
                      {s.approved ? <span className="text-xs font-medium text-emerald-700">Approved</span> : (
                        <form action={approveTimesheet.bind(null, s.id)}><button className="text-xs font-medium text-brand-700 hover:underline">Approve</button></form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
