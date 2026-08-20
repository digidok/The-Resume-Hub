import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Clock, UserCheck } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { WhatsAppReviewActions } from "@/components/admin/whatsapp-review-actions";
import type { WhatsAppClientStatus, WhatsAppReviewQueueItem, WhatsAppReviewStatus } from "@/types/database";

const SERVICE_LABELS: Record<string, string> = {
  cv_cover_letter: "CV + Cover Letter — R150",
  linkedin_revamp: "LinkedIn Revamp — R599",
};

const STATUS_STYLES: Record<WhatsAppReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  changes_requested: "bg-blue-100 text-blue-700",
};

const CLIENT_STATUS_LABELS: Record<WhatsAppClientStatus, string> = {
  pending: "Client: waiting",
  approved: "Client: approved — ready for payment",
  changes_requested: "Client: requested changes",
};

const CLIENT_STATUS_STYLES: Record<WhatsAppClientStatus, string> = {
  pending: "bg-slate-100 text-slate-500",
  approved: "bg-emerald-100 text-emerald-700",
  changes_requested: "bg-blue-100 text-blue-700",
};

export default async function WhatsAppOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase
      .from("whatsapp_review_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("whatsapp_review_queue")
      .select("*")
      .neq("status", "pending")
      .order("reviewed_at", { ascending: false })
      .limit(15),
  ]);

  const pendingItems = (pending ?? []) as WhatsAppReviewQueueItem[];
  const recentItems = (recent ?? []) as WhatsAppReviewQueueItem[];

  const signedUrls = new Map<string, string | null>();
  for (const item of [...pendingItems, ...recentItems]) {
    const { data } = await supabase.storage
      .from("whatsapp-previews")
      .createSignedUrl(item.preview_storage_path, 3600);
    signedUrls.set(item.id, data?.signedUrl ?? null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">WhatsApp orders</h1>
      <p className="mb-6 text-sm text-slate-500">
        Watermarked previews from the WhatsApp done-for-you CV/LinkedIn service, waiting for approval
        before the client sees them.
      </p>

      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <Clock className="h-4 w-4" />
        Pending review ({pendingItems.length})
      </h2>

      {pendingItems.length === 0 && (
        <Card className="mb-8 p-8 text-center text-slate-500">Nothing waiting for review.</Card>
      )}

      <div className="mb-10 space-y-4">
        {pendingItems.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {item.customer_name || item.customer_phone}
                </p>
                <p className="text-sm text-slate-500">
                  {item.customer_phone} · {SERVICE_LABELS[item.service_type] ?? item.service_type}
                  {item.template ? ` · ${item.template} template` : ""}
                </p>
                <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              {signedUrls.get(item.id) && (
                <a
                  href={signedUrls.get(item.id)!}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View preview
                </a>
              )}
            </div>
            {item.client_brief && (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{item.client_brief}</p>
            )}
            <div className="mt-4">
              <WhatsAppReviewActions reviewId={item.id} />
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Recently reviewed
      </h2>
      {recentItems.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing reviewed yet.</p>
      ) : (
        <div className="space-y-2">
          {recentItems.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-900">{item.customer_name || item.customer_phone}</p>
                <p className="text-xs text-slate-500">
                  {SERVICE_LABELS[item.service_type] ?? item.service_type} ·{" "}
                  {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : ""}
                  {item.amount_charged_zar != null && (
                    <>
                      {" "}
                      · Charged R{item.amount_charged_zar}
                      {item.discount_code_id ? " (discount applied)" : ""}
                    </>
                  )}
                </p>
                {item.admin_notes && <p className="mt-1 text-xs text-slate-500">“{item.admin_notes}”</p>}
                {item.client_notes && (
                  <p className="mt-1 text-xs text-slate-500">Client: “{item.client_notes}”</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.status]}`}
                >
                  {item.status.replace("_", " ")}
                </span>
                {item.status === "approved" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLIENT_STATUS_STYLES[item.client_status]}`}
                  >
                    {CLIENT_STATUS_LABELS[item.client_status]}
                  </span>
                )}
                {item.provisioned_profile_id && (
                  <Link
                    href={`/dashboard/admin/users/${item.provisioned_profile_id}`}
                    className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 hover:underline"
                  >
                    <UserCheck className="h-3 w-3" />
                    Paid & provisioned
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
