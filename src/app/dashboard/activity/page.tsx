import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { getRecentActivity } from "@/lib/dashboard/activity";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { Card } from "@/components/ui/card";

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await getRecentActivity(supabase, user.id, 50);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Activity</h1>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <History className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Nothing here yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Your applications, saved jobs, and reminders will show up here as you go.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <RecentActivityList items={items} />
        </Card>
      )}
    </div>
  );
}
