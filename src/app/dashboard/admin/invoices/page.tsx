import Link from "next/link";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { markInvoiceIssued, markInvoicePaid, cancelInvoiceRequest } from "@/lib/admin/actions";
import { SUBSCRIPTION_PACKAGES } from "@/lib/payfast/config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  invoiced: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-200 text-slate-600",
};

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: invoices } = await supabase
    .from("invoice_requests")
    .select("*, profiles:employer_id(full_name, phone_number)")
    .order("created_at", { ascending: false });

  const rows = invoices ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Invoice requests</h1>
      <p className="mb-6 text-sm text-slate-500">
        Employers who chose to pay by invoice/EFT instead of instant checkout.
      </p>

      {rows.length === 0 && (
        <Card className="p-8 text-center text-slate-500">No invoice requests yet.</Card>
      )}

      <div className="space-y-3">
        {rows.map((inv) => {
          const employer = Array.isArray(inv.profiles) ? inv.profiles[0] : inv.profiles;
          const pkg = SUBSCRIPTION_PACKAGES.find((p) => p.id === inv.package_id);
          return (
            <Card key={inv.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{inv.company_name}</p>
                  <p className="text-sm text-slate-500">
                    {inv.contact_person} · {inv.billing_email}
                    {employer?.full_name ? ` · Account: ${employer.full_name}` : ""}
                  </p>
                  {inv.vat_number && (
                    <p className="text-xs text-slate-400">VAT: {inv.vat_number}</p>
                  )}
                  {inv.billing_address && (
                    <p className="text-xs text-slate-400">{inv.billing_address}</p>
                  )}
                  {inv.notes && <p className="mt-1 text-xs text-slate-500">Note: {inv.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">R{Number(inv.amount_zar).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{pkg?.label ?? inv.package_id}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status]}`}
                  >
                    {inv.status}
                  </span>
                  {inv.invoice_number && (
                    <span className="text-xs text-slate-500">{inv.invoice_number}</span>
                  )}
                  <span className="text-xs text-slate-400">
                    Requested {new Date(inv.created_at).toLocaleDateString()}
                  </span>
                  {(inv.status === "invoiced" || inv.status === "paid") && (
                    <Link
                      href={`/dashboard/invoices/${inv.id}/print`}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      View invoice
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  {inv.status === "requested" && (
                    <>
                      <form
                        action={async () => {
                          "use server";
                          await markInvoiceIssued(inv.id);
                        }}
                      >
                        <Button type="submit" size="sm">
                          Issue invoice
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await cancelInvoiceRequest(inv.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="ghost">
                          Cancel
                        </Button>
                      </form>
                    </>
                  )}
                  {inv.status === "invoiced" && (
                    <>
                      <form
                        action={async () => {
                          "use server";
                          await markInvoicePaid(inv.id);
                        }}
                      >
                        <Button type="submit" size="sm">
                          Mark paid
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await cancelInvoiceRequest(inv.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="ghost">
                          Cancel
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
