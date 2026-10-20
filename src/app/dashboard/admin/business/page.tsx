import Link from "next/link";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/business/badges";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { createClient } from "@/lib/supabase/server";
import {
  REQUEST_STATUS_LABEL,
  documentLabel,
  formatDate,
  formatZar,
  type BillingRow,
  type RequestStatus,
  type StudioRequestRow,
} from "@/lib/business/format";

export const metadata = { title: "Business hub — The Resume Document Hub" };

const FILTERS: (RequestStatus | "all")[] = ["all", "new", "in_progress", "delivered", "cancelled"];

export default async function AdminBusinessPage({ searchParams }: PageProps<"/dashboard/admin/business">) {
  const { status } = await searchParams;
  const filter = FILTERS.includes(status as RequestStatus) ? (status as RequestStatus) : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { count: newEnquiries } = await supabase
    .from("business_enquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  const [{ data: all }, { data: billingData }] = await Promise.all([
    supabase.from("studio_requests").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("business_billing").select("*"),
  ]);
  const requests = (all ?? []) as StudioRequestRow[];
  const billing = (billingData ?? []) as BillingRow[];
  const shown = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = (s: RequestStatus) => requests.filter((r) => r.status === s).length;
  const invoicesOut = billing.filter((b) => b.kind === "invoice" && b.status === "sent");
  const quotesOut = billing.filter((b) => b.kind === "quote" && b.status === "sent");
  const paid = billing.filter((b) => b.kind === "invoice" && b.status === "paid");

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        Document Studio requests, quotes, invoices, screening, tasks and retainers for all clients.
        {newEnquiries ? ` ${newEnquiries} new enquir${newEnquiries === 1 ? "y" : "ies"} waiting.` : ""}
      </p>
      <BusinessAdminNav />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{counts("new")}</p>
          <p className="text-xs text-slate-500">New requests</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{counts("in_progress")}</p>
          <p className="text-xs text-slate-500">In progress</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{quotesOut.length}</p>
          <p className="text-xs text-slate-500">Quotes awaiting clients</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">
            {formatZar(invoicesOut.reduce((s, b) => s + Number(b.amount_zar), 0))}
          </p>
          <p className="text-xs text-slate-500">
            Outstanding · {formatZar(paid.reduce((s, b) => s + Number(b.amount_zar), 0))} paid
          </p>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/dashboard/admin/business" : `/dashboard/admin/business?status=${f}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filter === f ? "bg-brand-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? "All" : REQUEST_STATUS_LABEL[f]}
          </Link>
        ))}
      </div>

      <Card className="mt-4 divide-y divide-slate-100">
        {shown.length === 0 && <p className="p-6 text-sm text-slate-500">No requests in this view.</p>}
        {shown.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/admin/business/${r.reference}`}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">
                {r.company_name} <span className="font-normal text-slate-500">· {documentLabel(r.document_type)}</span>
              </p>
              <p className="text-xs text-slate-500">
                {r.reference} · {r.contact_name} · {r.email} · {formatDate(r.created_at)}
                {r.deadline ? ` · due ${formatDate(r.deadline)}` : ""}
              </p>
            </div>
            <RequestStatusBadge status={r.status} />
          </Link>
        ))}
      </Card>
    </div>
  );
}
