import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";

const statusStyles: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, item_name, status, created_at, profiles:user_id(full_name)")
    .order("created_at", { ascending: false });

  const rows = payments ?? [];
  const totalRevenue = rows
    .filter((p) => p.status === "complete")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const completedCount = rows.filter((p) => p.status === "complete").length;

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Payments</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue" value={`R${totalRevenue.toFixed(2)}`} />
        <StatCard label="Completed payments" value={completedCount} />
        <StatCard label="Total transactions" value={rows.length} />
      </div>

      {rows.length === 0 && <Card className="p-8 text-center text-slate-500">No payments yet.</Card>}

      <div className="space-y-2">
        {rows.map((payment) => {
          const payer = Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles;
          return (
            <Card key={payment.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-900">{payment.item_name}</p>
                <p className="text-sm text-slate-500">
                  {payer?.full_name || "Unknown"} · {new Date(payment.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">R{Number(payment.amount).toFixed(2)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[payment.status]}`}
                >
                  {payment.status}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
