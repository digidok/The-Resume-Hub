import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { setEnquiryStatus } from "@/lib/business/actions";
import { getDivision } from "@/lib/catalog/divisions";
import { formatDate } from "@/lib/business/format";

export const metadata = { title: "Enquiries — The Resume Document Hub" };

const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
const STYLE: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  quoted: "bg-amber-100 text-amber-800",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

type Enquiry = {
  id: string;
  reference: string;
  division: string;
  service: string;
  status: (typeof STATUSES)[number];
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  engagement: string;
  turnaround: string | null;
  requirement: string;
  details: Record<string, string>;
  marketing_consent: boolean;
  created_at: string;
};

export default async function AdminEnquiriesPage({ searchParams }: PageProps<"/dashboard/admin/business/enquiries">) {
  const { status, funnel } = await searchParams;
  const filter = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  let query = supabase.from("business_enquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter) query = query.eq("status", filter);
  if (funnel === "career") query = query.eq("division", "career-solutions");
  if (funnel === "business") query = query.neq("division", "career-solutions");
  const { data } = await query;
  const enquiries = (data ?? []) as Enquiry[];

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mt-1 text-sm text-slate-500">
        Leads from the division pages, with the service area already assigned. Move each one through the pipeline.
      </p>

      <div className="mt-4" />
      <BusinessAdminNav />
      <div className="mb-3 flex gap-4 text-sm">
        {[
          { v: undefined, l: "All funnels" },
          { v: "business", l: "Business" },
          { v: "career", l: "Career" },
        ].map((f) => (
          <a
            key={f.l}
            href={`/dashboard/admin/business/enquiries${f.v ? `?funnel=${f.v}` : ""}`}
            className={`font-medium ${funnel === f.v ? "text-brand-700 underline" : "text-slate-500 hover:text-slate-800"}`}
          >
            {f.l}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[undefined, ...STATUSES].map((f) => (
          <a
            key={f ?? "all"}
            href={`/dashboard/admin/business/enquiries?${[f ? `status=${f}` : "", funnel ? `funnel=${funnel}` : ""].filter(Boolean).join("&")}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              filter === f ? "bg-brand-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f ?? "All"}
          </a>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {enquiries.length === 0 && <Card className="p-6 text-sm text-slate-500">No enquiries in this view.</Card>}
        {enquiries.map((q) => (
          <Card key={q.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {q.business_name} <span className="font-normal text-slate-500">· {q.service}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {q.reference} · {getDivision(q.division)?.title ?? q.division} · {formatDate(q.created_at)} ·{" "}
                  {q.engagement}
                  {q.turnaround ? ` · ${q.turnaround}` : ""}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {q.contact_name} ·{" "}
                  <a className="text-brand-600 hover:underline" href={`mailto:${q.email}`}>
                    {q.email}
                  </a>
                  {q.phone ? ` · ${q.phone}` : ""}
                  {q.marketing_consent ? " · OK to send updates" : ""}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLE[q.status]}`}>
                {q.status}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{q.requirement}</p>
            {Object.keys(q.details ?? {}).length > 0 && (
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {Object.entries(q.details).map(([k, v]) => (
                  <div key={k}>
                    <dt className="inline text-slate-500">{k}: </dt>
                    <dd className="inline text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <form
                  key={s}
                  action={async () => {
                    "use server";
                    await setEnquiryStatus(q.id, s);
                  }}
                >
                  <Button type="submit" size="sm" variant={q.status === s ? "primary" : "outline"} className="capitalize">
                    {s}
                  </Button>
                </form>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
