import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import type { ActivityItem } from "@/lib/dashboard/activity";

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
        <Link href="/dashboard/activity" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Nothing here yet — activity shows up once you start applying.
        </p>
      ) : (
        <RecentActivityList items={items} />
      )}
    </Card>
  );
}
