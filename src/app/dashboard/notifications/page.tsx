import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notifications/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = notifications ?? [];
  const unreadCount = list.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">
              Mark all read
            </Button>
          </form>
        )}
      </div>

      {list.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Bell className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">No notifications yet</p>
            <p className="mt-1 text-sm text-slate-500">
              We&apos;ll let you know here when something needs your attention.
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {list.map((n) => (
          <Card key={n.id} className={`p-4 ${n.read ? "" : "bg-brand-50/60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                <p className="mt-1.5 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read && (
                <form action={markNotificationRead.bind(null, n.id)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Mark read
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
