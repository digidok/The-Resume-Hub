import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { requireAdminPage } from "@/lib/business/guard";
import { setPrivacyStatus } from "@/lib/business/actions";
import { formatDate } from "@/lib/business/format";

export const metadata = { title: "Privacy requests — The Resume Document Hub" };

type PrivacyRequest = { id: string; reference: string; request_type: string; name: string; email: string; details: string | null; status: string; created_at: string };
const TYPE_LABEL: Record<string, string> = {
  access: "Access my information",
  correction: "Correct my information",
  deletion: "Delete my information",
  marketing_opt_out: "Stop marketing",
  complaint: "Privacy complaint",
};
const STATUSES = ["new", "in_progress", "completed", "refused"];

export default async function PrivacyAdminPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("privacy_requests").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as PrivacyRequest[];

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        POPIA requests from the public privacy page. Verify the person&apos;s identity before releasing or deleting
        anything, and keep a note of what you did.
      </p>
      <BusinessAdminNav />
      <div className="space-y-4">
        {rows.length === 0 && <Card className="p-6 text-sm text-slate-500">No requests yet.</Card>}
        {rows.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{TYPE_LABEL[r.request_type] ?? r.request_type}</p>
                <p className="text-xs text-slate-500">
                  {r.reference} · {r.name} · {r.email} · {formatDate(r.created_at)}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">{r.status.replace("_", " ")}</span>
            </div>
            {r.details && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{r.details}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.filter((s) => s !== r.status).map((s) => (
                <form
                  key={s}
                  action={async () => {
                    "use server";
                    await setPrivacyStatus(r.id, s);
                  }}
                >
                  <Button type="submit" size="sm" variant="outline" className="capitalize">
                    {s.replace("_", " ")}
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
