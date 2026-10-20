import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, FileText, Receipt, Clock, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillingStatusBadge, HoursMeter, RequestStatusBadge } from "@/components/business/badges";
import { respondToQuote } from "@/lib/business/actions";
import { whatsappLink } from "@/lib/whatsapp-contacts";
import {
  documentLabel,
  formatDate,
  formatZar,
  hoursThisMonth,
  type BillingRow,
  type RetainerRow,
  type StudioRequestRow,
  type TimeEntryRow,
} from "@/lib/business/format";

export const metadata = { title: "Business dashboard — The Resume Document Hub" };

export default async function BusinessDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const email = user.email.toLowerCase();

  const [{ data: requestData }, { data: billingData }, { data: retainerData }] = await Promise.all([
    supabase
      .from("studio_requests")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false }),
    supabase
      .from("business_billing")
      .select("*")
      .eq("client_email", email)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabase
      .from("business_retainers")
      .select("*")
      .eq("client_email", email)
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  const requests = (requestData ?? []) as StudioRequestRow[];
  const billing = (billingData ?? []) as BillingRow[];
  const retainers = (retainerData ?? []) as RetainerRow[];

  const retainerIds = retainers.map((r) => r.id);
  const { data: entryData } = retainerIds.length
    ? await supabase
        .from("business_time_entries")
        .select("*")
        .in("retainer_id", retainerIds)
        .order("entry_date", { ascending: false })
    : { data: [] };
  const entries = (entryData ?? []) as TimeEntryRow[];

  const openRequests = requests.filter((r) => r.status === "new" || r.status === "in_progress").length;
  const quotesAwaiting = billing.filter((b) => b.kind === "quote" && b.status === "sent");
  const invoicesDue = billing.filter((b) => b.kind === "invoice" && b.status === "sent");
  const outstanding = invoicesDue.reduce((sum, b) => sum + Number(b.amount_zar), 0);
  const hoursLeft = retainers.reduce(
    (sum, r) => sum + Math.max(0, Number(r.monthly_hours) - hoursThisMonth(entries.filter((e) => e.retainer_id === r.id))),
    0
  );

  const isEmpty = requests.length === 0 && billing.length === 0 && retainers.length === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold text-slate-900">Business dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your requests, files, quotes, invoices and retainer hours with The Resume Document Hub. Showing
        everything linked to <span className="font-medium text-slate-700">{user.email}</span>.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Briefcase} label="Open requests" value={String(openRequests)} />
        <Stat icon={FileText} label="Quotes awaiting you" value={String(quotesAwaiting.length)} highlight={quotesAwaiting.length > 0} />
        <Stat icon={Receipt} label="Outstanding invoices" value={formatZar(outstanding)} />
        <Stat icon={Clock} label="Retainer hours left" value={retainers.length ? hoursLeft.toFixed(1) : "—"} />
      </div>

      {isEmpty && (
        <Card className="mt-8 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Nothing here yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Requests made with this email address, and any quotes, invoices or retainers we set up for it,
            appear here automatically. If you used a different email, sign in with that one.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/services#studio">
              <Button>Start a request</Button>
            </Link>
            <a href={whatsappLink("main", "Hi, I'd like help with my business dashboard.")} target="_blank" rel="noreferrer">
              <Button variant="outline">
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </Button>
            </a>
          </div>
        </Card>
      )}

      {requests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Requests</h2>
          <Card className="divide-y divide-slate-100">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/business/${r.reference}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{documentLabel(r.document_type)}</p>
                  <p className="text-xs text-slate-500">
                    {r.reference} · {r.company_name} · Requested {formatDate(r.created_at)}
                    {r.deadline ? ` · Due ${formatDate(r.deadline)}` : ""}
                  </p>
                </div>
                <RequestStatusBadge status={r.status} />
              </Link>
            ))}
          </Card>
        </section>
      )}

      {billing.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Quotes &amp; invoices</h2>
          <Card className="divide-y divide-slate-100">
            {billing.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {b.kind === "quote" ? "Quote" : "Invoice"} {b.number}
                  </p>
                  <p className="text-sm text-slate-600">{b.description}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(b.created_at)}
                    {b.due_date ? ` · Due ${formatDate(b.due_date)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900">{formatZar(b.amount_zar)}</span>
                  <BillingStatusBadge status={b.status} />
                  {b.kind === "quote" && b.status === "sent" && (
                    <div className="flex gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await respondToQuote(b.id, true);
                        }}
                      >
                        <Button size="sm" type="submit">
                          Accept
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await respondToQuote(b.id, false);
                        }}
                      >
                        <Button size="sm" type="submit" variant="outline">
                          Decline
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>
          <p className="mt-2 text-xs text-slate-500">
            Invoices are settled by EFT; use the invoice number as your payment reference. Questions? WhatsApp or
            email info@resumehub.co.za.
          </p>
        </section>
      )}

      {retainers.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Retainer &amp; hours</h2>
          <div className="space-y-4">
            {retainers.map((r) => {
              const mine = entries.filter((e) => e.retainer_id === r.id);
              const used = hoursThisMonth(mine);
              const recent = mine.slice(0, 6);
              return (
                <Card key={r.id} className="p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-slate-900">{r.plan_name}</p>
                    <p className="text-xs text-slate-500">
                      {formatZar(r.monthly_fee_zar)}/month · since {formatDate(r.start_date)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <HoursMeter used={used} total={Number(r.monthly_hours)} />
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {recent.length > 0 && (
                    <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
                      {recent.map((e) => (
                        <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                          <span className="text-slate-700">
                            <span className="text-slate-400">{formatDate(e.entry_date)}</span> · {e.description}
                          </span>
                          <span className="shrink-0 font-medium text-slate-900">{Number(e.hours)}h</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-4 ${highlight ? "border-accent-400 bg-accent-50" : ""}`}>
      <Icon className="h-5 w-5 text-brand-600" />
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}
