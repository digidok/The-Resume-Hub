import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";
import { addStaffMember, removeStaffMember } from "@/lib/business/staff-actions";

export const metadata = { title: "Staff — The Resume Document Hub" };

const ROLES = [
  { value: "consultant", label: "Consultant", note: "Appointments and availability" },
  { value: "recruiter", label: "Recruiter", note: "Appointments, talent pool, vacancies and pipeline" },
  { value: "payroll", label: "Payroll", note: "Placements and payroll" },
  { value: "delivery", label: "Service delivery", note: "Business requests and deliveries" },
];
const inputCls = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default async function StaffPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("staff_members")
    .select("user_id, staff_role, profiles:user_id(full_name)")
    .order("created_at");
  const rows = (data ?? []) as unknown as { user_id: string; staff_role: string; profiles: { full_name: string | null } | { full_name: string | null }[] | null }[];

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Staff and roles</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Give team members only the areas they need. Administrators can see everything; staff roles see only their own area.
        The person must already have an account.
      </p>
      <BusinessAdminNav />

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add a staff member</h2>
        <form action={addStaffMember} className="mt-3 flex flex-wrap items-end gap-2">
          <input name="email" type="email" required placeholder="Their account email" className={`${inputCls} min-w-64 flex-1`} />
          <select name="staff_role" className={inputCls} defaultValue="consultant">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Button type="submit">Add</Button>
        </form>
        <ul className="mt-4 space-y-1 text-xs text-slate-500">
          {ROLES.map((r) => (
            <li key={r.value}>
              <strong className="text-slate-700">{r.label}:</strong> {r.note}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current staff</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {rows.length === 0 && <li className="py-2 text-sm text-slate-500">No staff roles assigned yet.</li>}
          {rows.map((r) => {
            const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return (
              <li key={`${r.user_id}-${r.staff_role}`} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {p?.full_name || "Unnamed user"} · <span className="capitalize">{r.staff_role}</span>
                </span>
                <form action={removeStaffMember.bind(null, r.user_id, r.staff_role)}>
                  <button className="text-xs font-medium text-red-600 hover:underline">Remove</button>
                </form>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
