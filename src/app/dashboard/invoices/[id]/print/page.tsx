import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/resume/print-button";
import { SUBSCRIPTION_PACKAGES } from "@/lib/payfast/config";
import { INVOICE_ISSUER } from "@/lib/invoices/issuer";

export default async function InvoicePrintPage({
  params,
}: PageProps<"/dashboard/invoices/[id]/print">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invoice } = await supabase.from("invoice_requests").select("*").eq("id", id).single();

  if (!invoice || !invoice.invoice_number) notFound();

  const pkg = SUBSCRIPTION_PACKAGES.find((p) => p.id === invoice.package_id);

  return (
    <div className="min-h-full bg-slate-100 py-8">
      <div className="mx-auto mb-4 flex max-w-[8.5in] items-center justify-between px-4 print:hidden">
        <p className="text-sm text-slate-500">Invoice {invoice.invoice_number}</p>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-[8.5in] bg-white p-10 text-slate-900 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl font-bold">{INVOICE_ISSUER.companyName}</h1>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{INVOICE_ISSUER.address}</p>
            <p className="text-sm text-slate-600">{INVOICE_ISSUER.email}</p>
            <p className="text-sm text-slate-600">VAT: {INVOICE_ISSUER.vatNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wide text-slate-500">Invoice</h2>
            <p className="mt-1 text-sm text-slate-600">{invoice.invoice_number}</p>
            <p className="text-sm text-slate-600">
              {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : ""}
            </p>
            <p
              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                invoice.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {invoice.status === "paid" ? "Paid" : "Payment due"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
            <p className="mt-1 font-medium">{invoice.company_name}</p>
            <p className="text-sm text-slate-600">{invoice.contact_person}</p>
            <p className="text-sm text-slate-600">{invoice.billing_email}</p>
            {invoice.vat_number && <p className="text-sm text-slate-600">VAT: {invoice.vat_number}</p>}
            {invoice.billing_address && (
              <p className="whitespace-pre-line text-sm text-slate-600">{invoice.billing_address}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pay via EFT to</p>
            <p className="mt-1 text-sm text-slate-600">{INVOICE_ISSUER.bankName}</p>
            <p className="text-sm text-slate-600">Account holder: {INVOICE_ISSUER.accountHolder}</p>
            <p className="text-sm text-slate-600">Account number: {INVOICE_ISSUER.accountNumber}</p>
            <p className="text-sm text-slate-600">Branch code: {INVOICE_ISSUER.branchCode}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">Reference: {invoice.invoice_number}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3">{pkg?.label ?? invoice.package_id}</td>
              <td className="py-3 text-right">R{Number(invoice.amount_zar).toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 text-right font-semibold">Total due</td>
              <td className="pt-4 text-right text-lg font-bold">R{Number(invoice.amount_zar).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Notes</p>
            <p className="mt-1 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-400">
          Please use the reference above when making payment. Once received, your account will be
          updated within one business day.
        </p>
      </div>
    </div>
  );
}
