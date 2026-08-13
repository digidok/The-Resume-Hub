import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { setUserRole, grantCredits, revokeSubscription } from "@/lib/admin/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { StatCard } from "@/components/dashboard/stat-card";
import { AddCandidateForm } from "@/components/admin/add-candidate-form";
import type { ProfileRole } from "@/types/database";

const ROLE_OPTIONS: ProfileRole[] = ["candidate", "employer", "admin"];

const roleStyles: Record<ProfileRole, string> = {
  candidate: "bg-slate-100 text-slate-600",
  employer: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
};

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/dashboard/admin/users">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  let usersQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, role, plan, credits_remaining, created_at, source, phone_number, subscription_plan"
    )
    .order("created_at", { ascending: false });

  if (query) {
    usersQuery = usersQuery.ilike("full_name", `%${query}%`);
  }

  const { data: users } = await usersQuery;
  const whatsappCount = (users ?? []).filter((u) => u.source === "whatsapp").length;

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Users</h1>
      <p className="mb-6 text-sm text-slate-500">{users?.length ?? 0} accounts.</p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total accounts" value={users?.length ?? 0} />
        <StatCard label="From WhatsApp" value={whatsappCount} />
        <StatCard
          label="From app signup"
          value={(users?.length ?? 0) - whatsappCount}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex gap-2">
          <Input name="q" defaultValue={query} placeholder="Search by name…" className="max-w-xs" />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
        <AddCandidateForm />
      </div>

      <div className="space-y-3">
        {(users ?? []).map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/dashboard/admin/users/${u.id}`} className="font-medium text-slate-900 hover:underline">
                {u.full_name || "Unnamed"}
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleStyles[u.role as ProfileRole]}`}
                >
                  {u.role}
                </span>
                {u.source === "whatsapp" && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp{u.phone_number ? ` · ${u.phone_number}` : ""}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {u.plan} plan · {u.credits_remaining} credits
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const role = formData.get("role") as ProfileRole;
                  await setUserRole(u.id, role);
                }}
                className="flex items-center gap-2"
              >
                <Select name="role" defaultValue={u.role} className="py-1 text-sm">
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" variant="outline">
                  Set role
                </Button>
              </form>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const amount = Number(formData.get("amount") ?? 0);
                  await grantCredits(u.id, amount);
                }}
                className="flex items-center gap-2"
              >
                <Input
                  name="amount"
                  type="number"
                  placeholder="+credits"
                  className="w-24 py-1 text-sm"
                />
                <Button type="submit" size="sm" variant="outline">
                  Grant
                </Button>
              </form>
              {u.plan === "pro" && (
                <form
                  action={async () => {
                    "use server";
                    await revokeSubscription(u.id);
                  }}
                >
                  <Button type="submit" size="sm" variant="outline">
                    Revoke Pro
                  </Button>
                </form>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
