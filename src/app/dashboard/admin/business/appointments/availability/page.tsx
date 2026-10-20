import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireStaff } from "@/lib/business/guard";
import {
  addAvailabilityBlock,
  addAvailabilityWindow,
  removeAvailabilityBlock,
  removeAvailabilityWindow,
  setAppointmentTypeActive,
} from "@/lib/business/staff-actions";
import { formatSast } from "@/lib/appointments/slots";

export const metadata = { title: "Availability — The Resume Document Hub" };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const inputCls = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default async function AvailabilityPage() {
  const { supabase } = await requireStaff(["consultant", "recruiter"]);
  const [{ data: windows }, { data: blocks }, { data: types }] = await Promise.all([
    supabase.from("availability_windows").select("id, weekday, start_time, end_time").order("weekday").order("start_time"),
    supabase.from("availability_blocks").select("id, starts_at, ends_at, reason").order("starts_at"),
    supabase.from("appointment_types").select("id, name, duration_minutes, active").order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard/admin/business/appointments" label="Appointments" />
      <h1 className="text-3xl font-bold text-slate-900">Availability</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        When people can book. All times are South African time. Changes apply to new bookings straight away.
      </p>
      <BusinessAdminNav />

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Weekly opening hours</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(windows ?? []).length === 0 && <li className="py-2 text-sm text-slate-500">No hours set, so nobody can book.</li>}
          {(windows ?? []).map((w: { id: string; weekday: number; start_time: string; end_time: string }) => (
            <li key={w.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {DAYS[w.weekday]} · {w.start_time.slice(0, 5)} to {w.end_time.slice(0, 5)}
              </span>
              <form action={removeAvailabilityWindow.bind(null, w.id)}>
                <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addAvailabilityWindow} className="mt-4 flex flex-wrap items-end gap-2">
          <select name="weekday" className={inputCls} defaultValue="1">
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
          <input name="start_time" type="time" required defaultValue="09:00" className={inputCls} />
          <input name="end_time" type="time" required defaultValue="16:00" className={inputCls} />
          <Button type="submit">Add hours</Button>
        </form>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Days off and holidays</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(blocks ?? []).length === 0 && <li className="py-2 text-sm text-slate-500">None set.</li>}
          {(blocks ?? []).map((b: { id: string; starts_at: string; ends_at: string; reason: string | null }) => (
            <li key={b.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {formatSast(b.starts_at).split(",")[0]} to {formatSast(new Date(new Date(b.ends_at).getTime() - 1)).split(",")[0]}
                {b.reason ? ` · ${b.reason}` : ""}
              </span>
              <form action={removeAvailabilityBlock.bind(null, b.id)}>
                <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addAvailabilityBlock} className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-500">
            From
            <input name="from" type="date" required className={`${inputCls} mt-1 block`} />
          </label>
          <label className="text-xs text-slate-500">
            To (optional)
            <input name="to" type="date" className={`${inputCls} mt-1 block`} />
          </label>
          <input name="reason" maxLength={200} placeholder="Reason (optional)" className={inputCls} />
          <Button type="submit">Block days</Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Blocking days does not cancel appointments that are already booked.</p>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Appointment types</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(types ?? []).map((t: { id: string; name: string; duration_minutes: number; active: boolean }) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {t.name} · {t.duration_minutes} min
              </span>
              <form action={setAppointmentTypeActive.bind(null, t.id, !t.active)}>
                <button className="text-xs font-medium text-brand-700 hover:underline">
                  {t.active ? "Hide from booking" : "Show on booking page"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
