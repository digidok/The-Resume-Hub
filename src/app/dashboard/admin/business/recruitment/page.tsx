import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { RecruitmentNav } from "@/components/business/recruitment-nav";
import { requireStaff } from "@/lib/business/guard";
import { bulkAddToVacancy, bulkEmailTalent } from "@/lib/business/recruitment-actions";

export const metadata = { title: "Talent pool — The Resume Document Hub" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const inputCls = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const CONSENT_STYLE: Record<string, string> = {
  given: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  withdrawn: "bg-slate-100 text-slate-500",
};

type Talent = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  skills: string[];
  experience_years: number | null;
  availability: string;
  consent_status: string;
};

export default async function TalentPoolPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; availability?: string; consent?: string; page?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireStaff(["recruiter"]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  // Search words are matched against name, headline, location and skills. Strip characters that mean something in a filter.
  const words = (sp.q ?? "").toLowerCase().replace(/[^\p{L}\p{N} +#.-]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 6);

  let query = supabase
    .from("talent_pool")
    .select("id, full_name, email, phone, location, headline, skills, experience_years, availability, consent_status", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  for (const w of words) query = query.ilike("search_blob", `%${w}%`);
  if (sp.availability && ["immediate", "within_month", "later", "unknown"].includes(sp.availability)) query = query.eq("availability", sp.availability);
  if (sp.consent && ["given", "pending", "withdrawn"].includes(sp.consent)) query = query.eq("consent_status", sp.consent);

  const [{ data, count }, { data: vacancies }] = await Promise.all([
    query,
    supabase.from("vacancies").select("id, reference, client_name, title").eq("status", "open").order("created_at", { ascending: false }).limit(100),
  ]);
  const rows = (data ?? []) as Talent[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (sp.availability) u.set("availability", sp.availability);
    if (sp.consent) u.set("consent", sp.consent);
    u.set("page", String(p));
    return `?${u.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Search candidates, add many to a vacancy at once, and message them in bulk.</p>
      <BusinessAdminNav />
      <RecruitmentNav />

      {sp.msg && <p className="mb-4 rounded-md bg-brand-50 px-4 py-2.5 text-sm text-brand-800">{sp.msg}</p>}

      <form className="mb-5 flex flex-wrap items-end gap-2" method="get">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name, skills, location, job title" className={`${inputCls} min-w-72 flex-1`} />
        <select name="availability" defaultValue={sp.availability ?? ""} className={inputCls}>
          <option value="">Any availability</option>
          <option value="immediate">Available now</option>
          <option value="within_month">Within a month</option>
          <option value="later">Later</option>
          <option value="unknown">Not known</option>
        </select>
        <select name="consent" defaultValue={sp.consent ?? ""} className={inputCls}>
          <option value="">Any consent</option>
          <option value="given">Consent given</option>
          <option value="pending">Consent pending</option>
          <option value="withdrawn">Opted out</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      <p className="mb-2 text-sm text-slate-600">
        {total.toLocaleString("en-ZA")} candidate{total === 1 ? "" : "s"} found{total > PAGE_SIZE ? `, page ${page} of ${pages}` : ""}.
        {total === 0 && (
          <>
            {" "}
            <Link href="/dashboard/admin/business/recruitment/import" className="font-medium text-brand-700 hover:underline">
              Import CVs
            </Link>
          </>
        )}
      </p>

      <form>
        <input type="hidden" name="back" value={`/dashboard/admin/business/recruitment${qs(page)}`} />
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-8 px-3 py-2"><span className="sr-only">Select</span></th>
                <th className="px-3 py-2">Candidate</th>
                <th className="px-3 py-2">Skills</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Availability</th>
                <th className="px-3 py-2">Consent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className="align-top hover:bg-slate-50">
                  <td className="px-3 py-2"><input type="checkbox" name="talent" value={t.id} aria-label={`Select ${t.full_name}`} /></td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-900">{t.full_name}</p>
                    <p className="text-xs text-slate-500">{t.headline}</p>
                    <p className="text-xs text-slate-400">{t.email ?? t.phone}</p>
                  </td>
                  <td className="max-w-64 px-3 py-2 text-xs text-slate-600">
                    {t.skills.slice(0, 6).join(", ")}
                    {t.experience_years != null && <span className="block text-slate-400">{t.experience_years} yrs experience</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{t.location}</td>
                  <td className="px-3 py-2 capitalize text-slate-600">{t.availability.replace("_", " ")}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CONSENT_STYLE[t.consent_status]}`}>{t.consent_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {rows.length > 0 && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add ticked candidates to a vacancy</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <select name="vacancy_id" className={`${inputCls} min-w-56 flex-1`} defaultValue="">
                  <option value="" disabled>
                    Choose an open vacancy
                  </option>
                  {(vacancies ?? []).map((v: { id: string; reference: string; client_name: string; title: string }) => (
                    <option key={v.id} value={v.id}>
                      {v.reference} · {v.client_name} · {v.title}
                    </option>
                  ))}
                </select>
                <Button type="submit" formAction={bulkAddToVacancy}>
                  Add to vacancy
                </Button>
              </div>
              {(vacancies ?? []).length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No open vacancies. <Link className="text-brand-700 underline" href="/dashboard/admin/business/recruitment/vacancies">Create one</Link>.
                </p>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Message ticked candidates</h2>
              <div className="mt-3 space-y-2">
                <input name="subject" maxLength={200} placeholder="Subject" className={`${inputCls} w-full`} />
                <textarea name="message" rows={4} maxLength={4000} placeholder="Message (we add their first name, an opt-out link and your sign-off)" className={`${inputCls} w-full`} />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="include_booking" /> Add a button to book a call
                </label>
                <Button type="submit" formAction={bulkEmailTalent}>
                  Send email
                </Button>
                <p className="text-xs text-slate-500">Only candidates with consent recorded as given are contacted. Up to 200 at a time.</p>
              </div>
            </Card>
          </div>
        )}
      </form>

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={qs(page - 1)} className="font-medium text-brand-700 hover:underline">← Previous</Link> : <span />}
          {page < pages ? <Link href={qs(page + 1)} className="font-medium text-brand-700 hover:underline">Next →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
