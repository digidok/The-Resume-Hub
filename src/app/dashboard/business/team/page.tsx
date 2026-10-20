import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { addBusinessMember, removeBusinessMember } from "@/lib/business/actions";
import { formatDate } from "@/lib/business/format";

export const metadata = { title: "Team access — The Resume Document Hub" };

type Member = { id: string; owner_email: string; member_email: string; created_at: string };

export default async function BusinessTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const me = user.email.toLowerCase();

  const { data } = await supabase.from("business_members").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Member[];
  const given = rows.filter((r) => r.owner_email.toLowerCase() === me);
  const received = rows.filter((r) => r.member_email.toLowerCase() === me);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/dashboard/business" label="Business dashboard" />
      <h1 className="text-2xl font-bold text-slate-900">Team access</h1>
      <p className="mt-1 text-sm text-slate-500">
        Let colleagues see your requests, files, quotes, invoices and retainer hours. They sign in with their own
        email address. They can see everything linked to <span className="font-medium">{user.email}</span>, so only add
        people you trust with that information. You can remove access at any time.
      </p>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">People with access</h2>
        {given.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nobody yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {given.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-800">
                  {m.member_email} <span className="text-slate-400">· added {formatDate(m.created_at)}</span>
                </span>
                <form
                  action={async () => {
                    "use server";
                    await removeBusinessMember(m.id);
                  }}
                >
                  <button type="submit" className="text-slate-400 hover:text-red-600" aria-label={`Remove ${m.member_email}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addBusinessMember} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <input
            name="member_email"
            type="email"
            required
            placeholder="colleague@company.co.za"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Button type="submit">Add</Button>
        </form>
      </Card>

      {received.length > 0 && (
        <Card className="mt-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">You can see data for</h2>
          <ul className="mt-2 text-sm text-slate-700">
            {received.map((m) => (
              <li key={m.id}>{m.owner_email}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
