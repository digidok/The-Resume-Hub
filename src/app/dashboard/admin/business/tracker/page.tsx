import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";
import { formatZar, type BillingRow, type StudioRequestRow } from "@/lib/business/format";
import { addTarget, changeTarget, recordResult, saveMissReport, setTargetActive } from "@/lib/business/target-actions";
import { sastDate } from "@/lib/appointments/slots";
import {
  STAGES,
  ageDays,
  buildItems,
  formatTargetValue,
  hasMissReport,
  isMiss,
  itemsByStage,
  missStreak,
  reportOverdue,
  type EnquiryRow,
  type TargetResultRow,
  type TargetRow,
} from "@/lib/business/tracker";

export const metadata = { title: "Tracker — The Resume Document Hub" };
export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const SHOWN_PER_STAGE = 8;

function thisFriday(now: Date): string {
  const local = new Date(sastDate(now) + "T00:00:00Z");
  const add = (5 - local.getUTCDay() + 7) % 7;
  local.setUTCDate(local.getUTCDate() + add);
  return local.toISOString().slice(0, 10);
}

export default async function TrackerPage() {
  const { supabase } = await requireAdminPage();
  const now = new Date();

  const [enq, bill, reqs, tgt, res, vac, cand, plc] = await Promise.all([
    supabase.from("business_enquiries").select("id, reference, status, business_name, email, service, created_at").in("status", ["new", "contacted", "quoted"]).limit(500),
    supabase.from("business_billing").select("*").limit(2000),
    supabase.from("studio_requests").select("*").limit(1000),
    supabase.from("business_targets").select("*").order("area").order("measure"),
    supabase.from("business_target_results").select("*").order("period_end", { ascending: false }).limit(1500),
    supabase.from("vacancies").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("vacancy_candidates").select("stage").in("stage", ["shortlisted", "interview", "offered"]).limit(5000),
    supabase.from("placements").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const items = buildItems(
    {
      enquiries: (enq.data ?? []) as EnquiryRow[],
      billing: (bill.data ?? []) as BillingRow[],
      requests: (reqs.data ?? []) as StudioRequestRow[],
    },
    now
  );
  const byStage = itemsByStage(items);
  const flagged = items.filter((i) => i.flag).sort((a, b) => a.since.localeCompare(b.since));
  const outstanding = byStage.invoiced.reduce((s, i) => s + (i.amount ?? 0), 0);
  const paid30 = byStage.paid.reduce((s, i) => s + (i.amount ?? 0), 0);
  const open = items.length - byStage.paid.length;

  const targets = (tgt.data ?? []) as TargetRow[];
  const results = (res.data ?? []) as TargetResultRow[];
  const resultsFor = (id: string) => results.filter((r) => r.target_id === id);
  const missesNeedingReport = results.filter((r) => isMiss(r) && !hasMissReport(r));
  const overdueReports = results.filter((r) => reportOverdue(r, now));
  const friday = thisFriday(now);

  const pipeline = ((cand.data ?? []) as { stage: string }[]).reduce<Record<string, number>>((acc, r) => {
    acc[r.stage] = (acc[r.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business tracker</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Every open piece of business from enquiry to paid, what needs action today, and the weekly targets with a written report for every miss.
      </p>
      <BusinessAdminNav />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Open items</p><p className="mt-1 text-2xl font-bold text-slate-900">{open}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Need action</p><p className={`mt-1 text-2xl font-bold ${flagged.length ? "text-amber-600" : "text-slate-900"}`}>{flagged.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Invoiced, unpaid</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatZar(outstanding)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Paid, last 30 days</p><p className="mt-1 text-2xl font-bold text-emerald-700">{formatZar(paid30)}</p></Card>
      </div>

      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <AlertTriangle className="h-4 w-4" />
        Needs action ({flagged.length})
      </h2>
      {flagged.length === 0 ? (
        <Card className="mb-8 p-6 text-center text-slate-500">Nothing is waiting on you.</Card>
      ) : (
        <div className="mb-8 space-y-2">
          {flagged.map((i) => (
            <Card key={i.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-slate-900">{i.title}</p>
                <p className="text-xs text-slate-500">
                  {STAGES.find((s) => s.id === i.stage)?.label} · {i.detail}
                  {i.amount != null ? ` · ${formatZar(i.amount)}` : ""} · {ageDays(i.since, now)} days
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">{i.flag}</span>
                <Link href={i.href} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">From enquiry to paid</h2>
      <div className="mb-10 overflow-x-auto pb-2">
        <div className="grid min-w-[1100px] grid-cols-7 gap-3">
          {STAGES.map((s) => {
            const list = byStage[s.id];
            const total = list.reduce((sum, i) => sum + (i.amount ?? 0), 0);
            return (
              <div key={s.id} className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-200">
                <div className="px-1 pb-2">
                  <p className="text-sm font-semibold text-slate-900">{s.label} <span className="font-normal text-slate-500">({list.length})</span></p>
                  <p className="text-[11px] leading-tight text-slate-500">{s.hint}</p>
                  {total > 0 && <p className="mt-0.5 text-xs font-medium text-slate-700">{formatZar(total)}</p>}
                </div>
                <div className="space-y-2">
                  {list.slice(0, SHOWN_PER_STAGE).map((i) => (
                    <Link key={i.key} href={i.href} className={`block rounded-md bg-white p-2.5 text-xs shadow-sm ring-1 hover:ring-brand-300 ${i.flag ? "ring-amber-300" : "ring-slate-200"}`}>
                      <p className="font-medium text-slate-900">{i.title}</p>
                      <p className="mt-0.5 truncate text-slate-500">{i.detail}</p>
                      <p className="mt-1 flex justify-between text-slate-400">
                        <span>{ageDays(i.since, now)}d{i.amount != null ? ` · ${formatZar(i.amount)}` : ""}</span>
                        {i.flag && <span className="font-medium text-amber-700">{i.flag}</span>}
                      </p>
                    </Link>
                  ))}
                  {list.length > SHOWN_PER_STAGE && <p className="px-1 text-xs text-slate-500">+{list.length - SHOWN_PER_STAGE} more, oldest first above</p>}
                  {list.length === 0 && <p className="px-1 py-2 text-xs text-slate-400">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Weekly targets</h2>
      <p className="mb-3 text-sm text-slate-500">
        Record each result on Friday. A result below target needs a written cause and plan within 24 hours.
        {overdueReports.length > 0 && <strong className="text-red-600"> {overdueReports.length} report{overdueReports.length === 1 ? " is" : "s are"} overdue.</strong>}
        {missesNeedingReport.length > overdueReports.length && ` ${missesNeedingReport.length - overdueReports.length} more due today.`}
      </p>

      <div className="mb-4 space-y-3">
        {targets.length === 0 && <Card className="p-6 text-center text-slate-500">No targets yet. Add the first one below.</Card>}
        {targets.map((t) => {
          const mine = resultsFor(t.id);
          const latest = mine[0];
          const streak = missStreak(mine);
          const miss = latest && isMiss(latest);
          return (
            <Card key={t.id} className={`p-4 ${t.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{t.measure}</p>
                  <p className="text-xs text-slate-500">
                    {t.area} · owner {t.owner_name} · target {formatTargetValue(t.target, t.unit)} per {t.period}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {latest ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${miss ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {miss ? "Missed" : "Hit"}: {formatTargetValue(latest.actual, t.unit)} (week ending {latest.period_end})
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">No result yet</span>
                  )}
                  {streak >= 2 && (
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                      {streak} misses in a row{streak >= 3 ? ": reset or reassign" : ": review the plan"}
                    </span>
                  )}
                  <form action={setTargetActive.bind(null, t.id, !t.active)}>
                    <button className="text-xs text-slate-500 hover:underline">{t.active ? "Retire" : "Restore"}</button>
                  </form>
                </div>
              </div>

              {mine.slice(0, 6).length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {mine.slice(0, 6).map((r) => (
                    <li key={r.id} className={`rounded px-2 py-1 ${isMiss(r) ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {r.period_end}: {formatTargetValue(r.actual, t.unit)} / {formatTargetValue(r.target_at_time, t.unit)}
                    </li>
                  ))}
                </ul>
              )}

              {mine.filter((r) => isMiss(r) && !hasMissReport(r)).slice(0, 1).map((r) => (
                <form key={r.id} action={saveMissReport} className="mt-3 space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <input type="hidden" name="result_id" value={r.id} />
                  <p className="text-sm font-medium text-red-700">
                    Miss report for week ending {r.period_end} {reportOverdue(r, now) ? "(overdue)" : "(due within 24 hours)"}
                  </p>
                  <textarea name="miss_cause" required rows={2} maxLength={1000} placeholder="Main cause: which step, which clients, which numbers" className={inputCls} />
                  <textarea name="miss_plan" required rows={2} maxLength={1000} placeholder="What changes this week" className={inputCls} />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-slate-500">New date<input type="date" name="miss_new_date" className={`${inputCls} mt-1`} /></label>
                    <Button type="submit" className="self-end">Save report</Button>
                  </div>
                </form>
              ))}

              {latest && miss && hasMissReport(latest) && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <strong>Cause:</strong> {latest.miss_cause} <strong className="ml-2">Plan:</strong> {latest.miss_plan}
                  {latest.miss_new_date ? ` · new date ${latest.miss_new_date}` : ""}
                </p>
              )}

              {t.active && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-brand-700">Record a result</summary>
                  <form action={recordResult} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="target_id" value={t.id} />
                    <label className="text-xs text-slate-500">Week ending<input type="date" name="period_end" required defaultValue={friday} className={`${inputCls} mt-1`} /></label>
                    <label className="text-xs text-slate-500">Actual<input type="number" name="actual" step="0.01" min={0} required className={`${inputCls} mt-1`} /></label>
                    <label className="min-w-[12rem] flex-1 text-xs text-slate-500">Note<input name="note" maxLength={500} className={`${inputCls} mt-1`} /></label>
                    <Button type="submit" variant="outline">Save result</Button>
                  </form>
                  <form action={changeTarget} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <label className="text-xs text-slate-500">New target (future weeks only)<input type="number" name="target" step="0.01" min={0} required className={`${inputCls} mt-1`} /></label>
                    <label className="min-w-[12rem] flex-1 text-xs text-slate-500">Reason<input name="reason" required maxLength={300} className={`${inputCls} mt-1`} /></label>
                    <Button type="submit" variant="outline">Change target</Button>
                  </form>
                </details>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mb-10 p-4">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Add a target</summary>
          <form action={addTarget} className="mt-3 grid gap-3 sm:grid-cols-3">
            <input name="area" required maxLength={80} placeholder="Area, for example Sales" className={inputCls} />
            <input name="measure" required maxLength={160} placeholder="Measure, for example Quotes sent" className={inputCls} />
            <input name="owner_name" required maxLength={80} placeholder="Owner" className={inputCls} />
            <input name="target" type="number" step="0.01" min={0} required placeholder="Target number" className={inputCls} />
            <select name="unit" defaultValue="count" className={inputCls}>
              <option value="count">Count</option>
              <option value="zar">Rand (R)</option>
              <option value="percent">Percent</option>
            </select>
            <select name="period" defaultValue="week" className={inputCls}>
              <option value="week">Per week</option>
              <option value="month">Per month</option>
            </select>
            <div><Button type="submit">Add target</Button></div>
          </form>
        </details>
      </Card>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Recruitment snapshot</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Open vacancies", vac.count ?? 0],
          ["Shortlisted", pipeline.shortlisted ?? 0],
          ["In interview", pipeline.interview ?? 0],
          ["Offered", pipeline.offered ?? 0],
          ["Active placements", plc.count ?? 0],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value as number}</p></Card>
        ))}
        <Link href="/dashboard/admin/business/recruitment" className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm font-medium text-brand-700 hover:bg-slate-50">
          Open recruitment <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
