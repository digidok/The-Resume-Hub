import { notFound, redirect } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { BillingStatusBadge, RequestStatusBadge } from "@/components/business/badges";
import { createClient } from "@/lib/supabase/server";
import { getVisibleEmails } from "@/lib/business/access";
import { MessageThread } from "@/components/business/message-thread";
import { Button } from "@/components/ui/button";
import { approveDelivery, leaveFeedback, sendClientMessage } from "@/lib/business/actions";
import { signPaths } from "@/lib/business/queries";
import {
  documentLabel,
  formatDate,
  formatZar,
  type BillingRow,
  type DeliverableRow,
  type MessageRow,
  type StudioRequestRow,
} from "@/lib/business/format";

const STEPS = [
  { key: "new", label: "Received" },
  { key: "in_progress", label: "In progress" },
  { key: "delivered", label: "Delivered" },
] as const;

export default async function BusinessRequestPage({ params }: PageProps<"/dashboard/business/[reference]">) {
  const { reference } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data } = await supabase
    .from("studio_requests")
    .select("*")
    .eq("reference", reference)
    .in("email", await getVisibleEmails(supabase, user.email))
    .maybeSingle();
  if (!data) notFound();
  const request = data as StudioRequestRow;

  const [{ data: deliverableData }, { data: billingData }, { data: messageData }, { data: feedbackData }] = await Promise.all([
    supabase.from("business_deliverables").select("*").eq("request_id", request.id).order("created_at"),
    supabase
      .from("business_billing")
      .select("*")
      .eq("request_id", request.id)
      .neq("status", "draft")
      .order("created_at"),
    supabase.from("business_messages").select("*").eq("request_id", request.id).order("created_at"),
    supabase.from("business_feedback").select("rating, comment").eq("request_id", request.id).maybeSingle(),
  ]);
  const messages = (messageData ?? []) as MessageRow[];
  const feedback = feedbackData as { rating: number; comment: string | null } | null;
  const deliverables = (deliverableData ?? []) as DeliverableRow[];
  const billing = (billingData ?? []) as BillingRow[];

  const [uploadUrls, deliveryUrls] = await Promise.all([
    signPaths(supabase, "studio-uploads", request.files.map((f) => f.path)),
    signPaths(supabase, "studio-deliveries", deliverables.map((d) => d.storage_path)),
  ]);

  const stepIndex = request.status === "cancelled" ? -1 : STEPS.findIndex((s) => s.key === request.status);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard/business" label="Business dashboard" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{documentLabel(request.document_type)}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {request.reference} · {request.company_name} · Requested {formatDate(request.created_at)}
            {request.deadline ? ` · Needed by ${formatDate(request.deadline)}` : ""}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      {request.status !== "cancelled" && (
        <ol className="mt-6 grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <div className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-brand-600" : "bg-slate-200"}`} />
              <p className={`mt-1.5 text-xs font-medium ${i <= stepIndex ? "text-brand-700" : "text-slate-400"}`}>
                {s.label}
              </p>
            </li>
          ))}
        </ol>
      )}

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Delivered documents</h2>
        {deliverables.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing delivered yet. Finished files will appear here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {deliverables.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                  <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate">{d.name}</span>
                </span>
                {deliveryUrls.get(d.storage_path) && (
                  <a
                    href={deliveryUrls.get(d.storage_path)}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your brief &amp; uploads</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{request.brief || "No written brief."}</p>
        {request.files.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
            {request.files.map((f) => (
              <li key={f.path} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate text-slate-700">
                  <span className="capitalize text-slate-400">{f.kind}</span> · {f.name}
                </span>
                {uploadUrls.get(f.path) && (
                  <a href={uploadUrls.get(f.path)} className="shrink-0 font-medium text-brand-600 hover:text-brand-700">
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {billing.length > 0 && (
        <Card className="mt-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quotes &amp; invoices</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {billing.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-slate-700">
                  {b.kind === "quote" ? "Quote" : "Invoice"} {b.number} · {b.description}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{formatZar(b.amount_zar)}</span>
                  <BillingStatusBadge status={b.status} />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Accept or decline quotes from the main dashboard.</p>
        </Card>
      )}

      {request.status === "delivered" && (
        <Card className="mt-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Approve delivery</h2>
          {request.approved_at ? (
            <p className="mt-2 text-sm text-emerald-700">You approved this delivery on {formatDate(request.approved_at)}.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Check the delivered documents above. If they are what you asked for, approve them. If something needs
                to change, message your contact below instead.
              </p>
              <form
                className="mt-3"
                action={async () => {
                  "use server";
                  await approveDelivery(request.reference);
                }}
              >
                <Button type="submit">Approve delivered work</Button>
              </form>
            </>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">How did we do?</h3>
            {feedback ? (
              <p className="mt-1 text-sm text-slate-600">
                You rated this {feedback.rating} out of 5. Thank you.
                {feedback.comment ? ` "${feedback.comment}"` : ""}
              </p>
            ) : (
              <form
                className="mt-2 space-y-2"
                action={async (form: FormData) => {
                  "use server";
                  await leaveFeedback(request.id, form);
                }}
              >
                <select name="rating" required defaultValue="" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="" disabled>
                    Rating
                  </option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} out of 5
                    </option>
                  ))}
                </select>
                <textarea
                  name="comment"
                  rows={2}
                  maxLength={2000}
                  placeholder="Optional comment"
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm" variant="outline">
                  Send feedback
                </Button>
              </form>
            )}
          </div>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Messages with your contact</h2>
        <MessageThread
          messages={messages}
          viewer="client"
          action={sendClientMessage.bind(null, request.id, request.reference)}
        />
      </Card>
    </div>
  );
}
