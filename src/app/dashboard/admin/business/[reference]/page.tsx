import { notFound, redirect } from "next/navigation";
import { Download, FileText, Trash2 } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BillingStatusBadge, RequestStatusBadge } from "@/components/business/badges";
import { FileUpload } from "@/components/business/file-upload";
import { MessageThread } from "@/components/business/message-thread";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/business/queries";
import {
  addDeliverable,
  createBilling,
  sendTeamMessage,
  removeDeliverable,
  setBillingStatus,
  setRequestStatus,
} from "@/lib/business/actions";
import {
  REQUEST_STATUS_LABEL,
  documentLabel,
  formatDate,
  formatZar,
  type BillingRow,
  type BillingStatus,
  type DeliverableRow,
  type MessageRow,
  type RequestStatus,
  type StudioRequestRow,
} from "@/lib/business/format";

const STATUSES: RequestStatus[] = ["new", "in_progress", "delivered", "cancelled"];
const BILLING_NEXT: Record<string, { to: BillingStatus; label: string }[]> = {
  draft: [
    { to: "sent", label: "Send to client" },
    { to: "cancelled", label: "Cancel" },
  ],
  sent: [{ to: "cancelled", label: "Cancel" }],
  accepted: [],
  declined: [],
  paid: [],
  cancelled: [],
};
const INVOICE_NEXT = {
  draft: BILLING_NEXT.draft,
  sent: [
    { to: "paid" as const, label: "Mark paid" },
    { to: "cancelled" as const, label: "Cancel" },
  ],
  accepted: [],
  declined: [],
  paid: [],
  cancelled: [],
} as Record<string, { to: BillingStatus; label: string }[]>;

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default async function AdminBusinessRequestPage({
  params,
}: PageProps<"/dashboard/admin/business/[reference]">) {
  const { reference } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data } = await supabase.from("studio_requests").select("*").eq("reference", reference).maybeSingle();
  if (!data) notFound();
  const request = data as StudioRequestRow;

  const [{ data: deliverableData }, { data: billingData }, { data: messageData }] = await Promise.all([
    supabase.from("business_deliverables").select("*").eq("request_id", request.id).order("created_at"),
    supabase.from("business_billing").select("*").eq("request_id", request.id).order("created_at"),
    supabase.from("business_messages").select("*").eq("request_id", request.id).order("created_at"),
  ]);
  const messages = (messageData ?? []) as MessageRow[];
  const deliverables = (deliverableData ?? []) as DeliverableRow[];
  const billing = (billingData ?? []) as BillingRow[];

  const [uploadUrls, deliveryUrls] = await Promise.all([
    signPaths(supabase, "studio-uploads", request.files.map((f) => f.path)),
    signPaths(supabase, "studio-deliveries", deliverables.map((d) => d.storage_path)),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <BusinessAdminNav />
      <BackLink href="/dashboard/admin/business" label="All requests" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{request.company_name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {documentLabel(request.document_type)} · {request.template_style} · {request.reference} ·{" "}
            {formatDate(request.created_at)}
            {request.deadline ? ` · due ${formatDate(request.deadline)}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {request.contact_name} ·{" "}
            <a className="text-brand-600 hover:underline" href={`mailto:${request.email}`}>
              {request.email}
            </a>
            {request.phone ? ` · ${request.phone}` : ""}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <form
              key={s}
              action={async () => {
                "use server";
                await setRequestStatus(request.id, s);
              }}
            >
              <Button type="submit" size="sm" variant={request.status === s ? "primary" : "outline"}>
                {REQUEST_STATUS_LABEL[s]}
              </Button>
            </form>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Client brief &amp; uploads</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{request.brief || "No written brief."}</p>
        {request.files.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
            {request.files.map((f) => (
              <li key={f.path} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate text-slate-700">
                  <span className="capitalize text-slate-400">{f.kind}</span> · {f.name}
                  {f.size ? ` · ${(f.size / 1024 / 1024).toFixed(1)}MB` : ""}
                </span>
                {uploadUrls.get(f.path) ? (
                  <a href={uploadUrls.get(f.path)} className="shrink-0 font-medium text-brand-600 hover:text-brand-700">
                    Download
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-slate-400">not uploaded</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Delivered files</h2>
          <FileUpload
            bucket="studio-deliveries"
            folder={request.reference}
            label="Upload delivered file"
            register={addDeliverable.bind(null, request.id)}
          />
        </div>
        {deliverables.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing uploaded yet. Clients see these as soon as you add them.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {deliverables.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                  <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {deliveryUrls.get(d.storage_path) && (
                    <a href={deliveryUrls.get(d.storage_path)} className="text-brand-600 hover:text-brand-700">
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await removeDeliverable(d.id);
                    }}
                  >
                    <button type="submit" className="text-slate-400 hover:text-red-600" aria-label="Remove file">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quotes &amp; invoices</h2>
        {billing.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {billing.map((b) => {
              const actions = (b.kind === "quote" ? BILLING_NEXT : INVOICE_NEXT)[b.status] ?? [];
              return (
                <li key={b.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {b.kind === "quote" ? "Quote" : "Invoice"} {b.number}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{formatZar(b.amount_zar)}</span>
                      <BillingStatusBadge status={b.status} admin />
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{b.description}</p>
                  {actions.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {actions.map((a) => (
                        <form
                          key={a.to}
                          action={async () => {
                            "use server";
                            await setBillingStatus(b.id, a.to);
                          }}
                        >
                          <Button type="submit" size="sm" variant={a.to === "cancelled" ? "ghost" : "primary"}>
                            {a.label}
                          </Button>
                        </form>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <form
          action={async (form: FormData) => {
            "use server";
            await createBilling(request.id, form);
          }}
          className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2"
        >
          <input type="hidden" name="client_email" value={request.email} />
          <input type="hidden" name="client_name" value={request.company_name} />
          <select name="kind" className={inputCls} defaultValue="quote">
            <option value="quote">Quote</option>
            <option value="invoice">Invoice</option>
          </select>
          <input name="amount" required inputMode="decimal" placeholder="Amount (ZAR)" className={inputCls} />
          <input name="description" required maxLength={500} placeholder="Description" className={`${inputCls} sm:col-span-2`} />
          <label className="text-xs text-slate-500">
            Due date (optional)
            <input name="due_date" type="date" className={`${inputCls} mt-1`} />
          </label>
          <div className="flex items-end">
            <Button type="submit">Create as draft</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Messages with client</h2>
        <MessageThread
          messages={messages}
          viewer="team"
          action={sendTeamMessage.bind(null, request.id, request.reference, request.email)}
        />
      </Card>
    </div>
  );
}
