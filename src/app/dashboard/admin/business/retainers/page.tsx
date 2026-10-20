import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoursMeter } from "@/components/business/badges";
import { createClient } from "@/lib/supabase/server";
import { createRetainer, logTime, setRetainerActive } from "@/lib/business/actions";
import {
  formatDate,
  formatZar,
  hoursThisMonth,
  type RetainerRow,
  type TimeEntryRow,
} from "@/lib/business/format";

export const metadata = { title: "Retainers & hours — The Resume Document Hub" };

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default async function AdminRetainersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: retainerData }, { data: entryData }] = await Promise.all([
    supabase.from("business_retainers").select("*").order("active", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("business_time_entries").select("*").order("entry_date", { ascending: false }).limit(1000),
  ]);
  const retainers = (retainerData ?? []) as RetainerRow[];
  const entries = (entryData ?? []) as TimeEntryRow[];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard/admin/business" label="Business hub" />
      <h1 className="text-3xl font-bold text-slate-900">Retainers &amp; hours</h1>
      <p className="mt-1 text-sm text-slate-500">
        Monthly retainer plans per client. Hours you log here show on the client&apos;s dashboard. The client sees
        the plan under the email address you enter, once they sign in with it.
      </p>

      <div className="mt-6 space-y-4">
        {retainers.length === 0 && <Card className="p-6 text-sm text-slate-500">No retainers yet.</Card>}
        {retainers.map((r) => {
          const mine = entries.filter((e) => e.retainer_id === r.id);
          const used = hoursThisMonth(mine);
          return (
            <Card key={r.id} className={`p-5 ${r.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {r.company_name} <span className="font-normal text-slate-500">· {r.plan_name}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.client_email} · {formatZar(r.monthly_fee_zar)}/month · since {formatDate(r.start_date)}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await setRetainerActive(r.id, !r.active);
                  }}
                >
                  <Button type="submit" size="sm" variant="ghost">
                    {r.active ? "End retainer" : "Reactivate"}
                  </Button>
                </form>
              </div>
              <div className="mt-3">
                <HoursMeter used={used} total={Number(r.monthly_hours)} />
              </div>

              {r.active && (
                <form
                  action={async (form: FormData) => {
                    "use server";
                    await logTime(r.id, form);
                  }}
                  className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-[7rem_7rem_1fr_auto]"
                >
                  <input name="entry_date" type="date" defaultValue={today} className={inputCls} />
                  <input name="hours" required inputMode="decimal" placeholder="Hours" className={inputCls} />
                  <input name="description" required maxLength={300} placeholder="What was done" className={inputCls} />
                  <Button type="submit">Log time</Button>
                </form>
              )}

              {mine.length > 0 && (
                <ul className="mt-3 divide-y divide-slate-100 text-sm">
                  {mine.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex justify-between gap-3 py-1.5">
                      <span className="text-slate-700">
                        <span className="text-slate-400">{formatDate(e.entry_date)}</span> · {e.description}
                      </span>
                      <span className="shrink-0 font-medium">{Number(e.hours)}h</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New retainer</h2>
        <form
          action={createRetainer}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <input name="company_name" required maxLength={200} placeholder="Company name" className={inputCls} />
          <input name="client_email" required type="email" placeholder="Client email (they sign in with this)" className={inputCls} />
          <input name="plan_name" required maxLength={200} placeholder="Plan, e.g. Executive support 20h" className={inputCls} />
          <input name="monthly_hours" required inputMode="decimal" placeholder="Hours per month" className={inputCls} />
          <input name="monthly_fee" required inputMode="decimal" placeholder="Monthly fee (ZAR)" className={inputCls} />
          <div className="flex items-end">
            <Button type="submit">Create retainer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
