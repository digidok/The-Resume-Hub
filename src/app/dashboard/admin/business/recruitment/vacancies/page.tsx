import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { RecruitmentNav } from "@/components/business/recruitment-nav";
import { requireStaff } from "@/lib/business/guard";
import { createVacancy } from "@/lib/business/recruitment-actions";

export const metadata = { title: "Vacancies — The Resume Document Hub" };
export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const STATUS_STYLE: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  on_hold: "bg-amber-100 text-amber-700",
  filled: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-500",
};

type Vacancy = { id: string; reference: string; client_name: string; title: string; location: string | null; headcount: number; employment_type: string; status: string; start_date: string | null };

export default async function VacanciesPage() {
  const { supabase } = await requireStaff(["recruiter"]);
  const [{ data }, { data: pipeline }] = await Promise.all([
    supabase.from("vacancies").select("id, reference, client_name, title, location, headcount, employment_type, status, start_date").order("created_at", { ascending: false }).limit(200),
    supabase.from("vacancy_candidates").select("vacancy_id, stage").limit(20000),
  ]);
  const vacancies = (data ?? []) as Vacancy[];
  const counts = new Map<string, { total: number; placed: number }>();
  for (const p of (pipeline ?? []) as { vacancy_id: string; stage: string }[]) {
    const c = counts.get(p.vacancy_id) ?? { total: 0, placed: 0 };
    c.total += 1;
    if (p.stage === "placed") c.placed += 1;
    counts.set(p.vacancy_id, c);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Client vacancies and how far each one has progressed.</p>
      <BusinessAdminNav />
      <RecruitmentNav />

      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New vacancy</h2>
        <form action={createVacancy} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="client_name" required maxLength={160} placeholder="Client company" className={inputCls} />
          <input name="client_email" type="email" maxLength={200} placeholder="Client contact email (optional)" className={inputCls} />
          <input name="title" required maxLength={200} placeholder="Role, e.g. General worker" className={inputCls} />
          <input name="location" maxLength={160} placeholder="Work location" className={inputCls} />
          <select name="employment_type" defaultValue="temporary" className={inputCls}>
            <option value="temporary">Temporary</option>
            <option value="fixed_term">Fixed term</option>
            <option value="project">Project / seasonal</option>
            <option value="permanent">Permanent</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input name="headcount" type="number" min={1} max={10000} defaultValue={1} aria-label="People needed" className={inputCls} />
            <input name="start_date" type="date" aria-label="Start date" className={inputCls} />
          </div>
          <textarea name="description" rows={3} maxLength={4000} placeholder="Requirements, hours, pay range" className={`${inputCls} sm:col-span-2`} />
          <div><Button type="submit">Create vacancy</Button></div>
        </form>
      </Card>

      <div className="mt-6 space-y-3">
        {vacancies.length === 0 && <p className="text-sm text-slate-500">No vacancies yet.</p>}
        {vacancies.map((v) => {
          const c = counts.get(v.id) ?? { total: 0, placed: 0 };
          return (
            <Link key={v.id} href={`/dashboard/admin/business/recruitment/vacancies/${v.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4 hover:border-brand-300">
                <div>
                  <p className="font-semibold text-slate-900">{v.title} <span className="font-normal text-slate-500">· {v.client_name}</span></p>
                  <p className="text-xs text-slate-500">
                    {v.reference} · {v.employment_type.replace("_", " ")} · {v.headcount} needed
                    {v.location ? ` · ${v.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">{c.placed}/{v.headcount} placed · {c.total} in pipeline</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[v.status]}`}>{v.status.replace("_", " ")}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
