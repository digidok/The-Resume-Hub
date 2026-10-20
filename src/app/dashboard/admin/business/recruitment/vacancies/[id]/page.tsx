import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { RecruitmentNav } from "@/components/business/recruitment-nav";
import { requireStaff } from "@/lib/business/guard";
import { bulkEmailTalent, bulkSetStage, setVacancyStatus } from "@/lib/business/recruitment-actions";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "sourced", label: "Sourced" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "offered", label: "Offered" },
  { key: "placed", label: "Placed" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
];
const inputCls = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

type Entry = {
  id: string;
  stage: string;
  talent_pool: { id: string; full_name: string; email: string | null; location: string | null; headline: string | null; consent_status: string } | null;
};

export default async function VacancyPipelinePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireStaff(["recruiter"]);
  const [{ data: vacancy }, { data: entries }] = await Promise.all([
    supabase.from("vacancies").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("vacancy_candidates")
      .select("id, stage, talent_pool(id, full_name, email, location, headline, consent_status)")
      .eq("vacancy_id", id)
      .order("updated_at", { ascending: false })
      .limit(1000),
  ]);
  if (!vacancy) notFound();
  const list = ((entries ?? []) as unknown as (Omit<Entry, "talent_pool"> & { talent_pool: Entry["talent_pool"] | Entry["talent_pool"][] })[]).map((e) => ({
    ...e,
    talent_pool: Array.isArray(e.talent_pool) ? e.talent_pool[0] : e.talent_pool,
  })) as Entry[];
  const placed = list.filter((e) => e.stage === "placed").length;

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard/admin/business/recruitment/vacancies" label="Vacancies" />
      <h1 className="text-3xl font-bold text-slate-900">{vacancy.title}</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        {vacancy.client_name} · {vacancy.reference} · {placed}/{vacancy.headcount} placed · {vacancy.employment_type.replace("_", " ")}
        {vacancy.location ? ` · ${vacancy.location}` : ""}
      </p>
      <BusinessAdminNav />
      <RecruitmentNav />
      {sp.msg && <p className="mb-4 rounded-md bg-brand-50 px-4 py-2.5 text-sm text-brand-800">{sp.msg}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Vacancy status:</span>
        {["open", "on_hold", "filled", "closed"].map((s) => (
          <form key={s} action={setVacancyStatus.bind(null, id, s)}>
            <button className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${vacancy.status === s ? "bg-brand-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
              {s.replace("_", " ")}
            </button>
          </form>
        ))}
      </div>

      <form>
        <input type="hidden" name="vacancy_id" value={id} />
        <input type="hidden" name="back" value={`/dashboard/admin/business/recruitment/vacancies/${id}`} />
        {list.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">
            No candidates yet. Search the talent pool, tick people and choose <strong>Add to vacancy</strong>.
          </Card>
        ) : (
          <div className="space-y-5">
            {STAGES.map((stage) => {
              const inStage = list.filter((e) => e.stage === stage.key);
              if (inStage.length === 0) return null;
              return (
                <Card key={stage.key} className="overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
                    {stage.label} <span className="font-normal text-slate-500">({inStage.length})</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {inStage.map((e) => (
                      <li key={e.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                        <input type="checkbox" name="rows" value={e.id} className="mt-1" aria-label={`Select ${e.talent_pool?.full_name}`} />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{e.talent_pool?.full_name}</p>
                          <p className="text-xs text-slate-500">
                            {[e.talent_pool?.headline, e.talent_pool?.location, e.talent_pool?.email].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}

            <Card className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">For ticked candidates</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select name="stage" className={inputCls} defaultValue="shortlisted">
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      Move to {s.label.toLowerCase()}
                    </option>
                  ))}
                </select>
                <Button type="submit" formAction={bulkSetStage}>
                  Move
                </Button>
              </div>
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-800">Email them (interview invitation, update, request for documents)</p>
                <input name="subject" maxLength={200} placeholder="Subject" className={`${inputCls} w-full`} />
                <textarea name="message" rows={4} maxLength={4000} placeholder="Message" className={`${inputCls} w-full`} />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="include_booking" /> Add a button to book a call
                </label>
                <Button type="submit" formAction={bulkEmailTalent}>
                  Send email
                </Button>
                <p className="text-xs text-slate-500">Only candidates with consent recorded as given are contacted.</p>
              </div>
            </Card>
          </div>
        )}
      </form>
    </div>
  );
}
