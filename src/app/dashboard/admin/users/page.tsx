import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setUserRole, grantCredits } from "@/lib/admin/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
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
    .select("id, full_name, role, plan, credits_remaining, created_at")
    .order("created_at", { ascending: false });

  if (query) {
    usersQuery = usersQuery.ilike("full_name", `%${query}%`);
  }

  const { data: users } = await usersQuery;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Users</h1>
      <p className="mb-6 text-sm text-slate-500">{users?.length ?? 0} accounts.</p>

      <form method="get" className="mb-6 flex gap-2">
        <Input name="q" defaultValue={query} placeholder="Search by name…" className="max-w-xs" />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>

      <div className="space-y-3">
        {(users ?? []).map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-slate-900">{u.full_name || "Unnamed"}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleStyles[u.role as ProfileRole]}`}
                >
                  {u.role}
                </span>
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
