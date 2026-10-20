import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";

export const metadata = { title: "Audit log — The Resume Document Hub" };

type Entry = { id: string; actor_email: string | null; action: string; entity: string; entity_id: string | null; meta: Record<string, unknown>; created_at: string };

export default async function AuditPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const entries = (data ?? []) as Entry[];

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Append-only record of sensitive staff actions: who did what, and when. Entries cannot be edited or deleted.
      </p>
      <BusinessAdminNav />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">When</th>
              <th className="px-3 py-3">Who</th>
              <th className="px-3 py-3">Action</th>
              <th className="px-5 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-slate-500">
                  Nothing logged yet.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-5 py-2.5 text-slate-500">
                  {new Date(e.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{e.actor_email ?? "system"}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">{e.action}</td>
                <td className="px-5 py-2.5 text-xs text-slate-500">
                  {e.entity}
                  {Object.keys(e.meta ?? {}).length ? ` · ${JSON.stringify(e.meta)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
