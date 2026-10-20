import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";
import { createTask, setTaskStatus } from "@/lib/business/actions";
import { formatDate } from "@/lib/business/format";

export const metadata = { title: "Tasks — The Resume Document Hub" };

type Task = { id: string; title: string; request_id: string | null; assigned_to: string | null; due_date: string | null; status: "todo" | "doing" | "done" };
const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "In progress" },
  { key: "done", label: "Done" },
];
const inputCls = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default async function TasksPage() {
  const { supabase } = await requireAdminPage();
  const [{ data: taskData }, { data: staff }, { data: reqs }] = await Promise.all([
    supabase.from("business_tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("profiles").select("id, full_name").eq("role", "admin"),
    supabase.from("studio_requests").select("id, reference, company_name").order("created_at", { ascending: false }).limit(100),
  ]);
  const tasks = (taskData ?? []) as Task[];
  const people = new Map((staff ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name || "Staff"]));
  const refs = new Map((reqs ?? []).map((r: { id: string; reference: string }) => [r.id, r.reference]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Allocate work to staff and track service deadlines.</p>
      <BusinessAdminNav />

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New task</h2>
        <form action={createTask} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="title" required maxLength={200} placeholder="What needs doing" className={`${inputCls} sm:col-span-2`} />
          <select name="assigned_to" className={inputCls} defaultValue="">
            <option value="">Unassigned</option>
            {[...people.entries()].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <input name="due_date" type="date" className={inputCls} />
          <select name="request_id" className={inputCls} defaultValue="">
            <option value="">Not linked to a request</option>
            {(reqs ?? []).map((r: { id: string; reference: string; company_name: string }) => (
              <option key={r.id} value={r.id}>
                {r.reference} · {r.company_name}
              </option>
            ))}
          </select>
          <div className="flex items-end">
            <Button type="submit">Add task</Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key}>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">
                {col.label} <span className="font-normal text-slate-400">({items.length})</span>
              </h2>
              <div className="space-y-3">
                {items.map((t) => {
                  const overdue = t.due_date && t.due_date < today && t.status !== "done";
                  return (
                    <Card key={t.id} className="p-4">
                      <p className="text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.assigned_to ? people.get(t.assigned_to) ?? "Staff" : "Unassigned"}
                        {t.request_id && refs.get(t.request_id) ? ` · ${refs.get(t.request_id)}` : ""}
                        {t.due_date ? (
                          <span className={overdue ? "font-semibold text-red-600" : ""}> · due {formatDate(t.due_date)}</span>
                        ) : (
                          ""
                        )}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {COLUMNS.filter((c) => c.key !== t.status).map((c) => (
                          <form
                            key={c.key}
                            action={async () => {
                              "use server";
                              await setTaskStatus(t.id, c.key);
                            }}
                          >
                            <Button type="submit" size="sm" variant="outline">
                              {c.label}
                            </Button>
                          </form>
                        ))}
                      </div>
                    </Card>
                  );
                })}
                {items.length === 0 && <p className="text-sm text-slate-400">Nothing here.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
