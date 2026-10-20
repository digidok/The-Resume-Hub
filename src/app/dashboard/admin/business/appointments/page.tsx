import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireStaff } from "@/lib/business/guard";
import { setAppointmentStatus } from "@/lib/business/staff-actions";
import { formatSast } from "@/lib/appointments/slots";

export const metadata = { title: "Appointments — The Resume Document Hub" };

type Row = {
  id: string;
  reference: string;
  starts_at: string;
  status: "booked" | "completed" | "cancelled" | "no_show";
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  notes: string | null;
  appointment_types: { name: string } | { name: string }[] | null;
};

const STATUS_STYLE: Record<Row["status"], string> = {
  booked: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-amber-100 text-amber-700",
};

export default async function AppointmentsAdminPage() {
  const { supabase } = await requireStaff(["consultant", "recruiter"]);
  const { data } = await supabase
    .from("appointments")
    .select("id, reference, starts_at, status, name, email, phone, topic, notes, appointment_types(name)")
    .order("starts_at", { ascending: true })
    .limit(300);
  const rows = (data ?? []) as Row[];
  const now = new Date().toISOString();
  const upcoming = rows.filter((r) => r.status === "booked" && r.starts_at >= now);
  const past = rows.filter((r) => !(r.status === "booked" && r.starts_at >= now)).reverse();

  const renderRow = (r: Row, actions: boolean) => {
    const t = Array.isArray(r.appointment_types) ? r.appointment_types[0] : r.appointment_types;
    return (
      <Card key={r.id} className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">
              {formatSast(r.starts_at)} · {t?.name}
            </p>
            <p className="text-sm text-slate-700">
              {r.name} · <a className="text-brand-700 hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
              {r.phone ? ` · ${r.phone}` : ""}
            </p>
            {r.topic && <p className="mt-1 text-sm text-slate-600">Topic: {r.topic}</p>}
            {r.notes && <p className="mt-1 text-sm text-slate-500">{r.notes}</p>}
            <p className="mt-1 text-xs text-slate-400">{r.reference}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[r.status]}`}>
              {r.status.replace("_", " ")}
            </span>
            {actions && (
              <div className="flex gap-1.5">
                {(["completed", "no_show", "cancelled"] as const).map((s) => (
                  <form key={s} action={setAppointmentStatus.bind(null, r.id, s)}>
                    <button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      {s === "completed" ? "Completed" : s === "no_show" ? "No-show" : "Cancel"}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Consultations, screening and recruitment calls booked online.</p>
      <BusinessAdminNav />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming ({upcoming.length})</h2>
        <Link href="/dashboard/admin/business/appointments/availability" className="text-sm font-medium text-brand-700 hover:underline">
          Opening hours and days off
        </Link>
      </div>
      <div className="space-y-3">
        {upcoming.length === 0 && <p className="text-sm text-slate-500">Nothing booked yet.</p>}
        {upcoming.map((r) => renderRow(r, true))}
      </div>
      <h2 className="mb-3 mt-10 text-lg font-semibold text-slate-900">Past and closed</h2>
      <div className="space-y-3">{past.slice(0, 50).map((r) => renderRow(r, false))}</div>
    </div>
  );
}
