import {
  CheckCircle2,
  CalendarClock,
  XCircle,
  PartyPopper,
  Bookmark,
  Sparkles,
  Clock,
} from "lucide-react";
import { timeAgo, type ActivityItem, type ActivityType } from "@/lib/dashboard/activity";

const TYPE_META: Record<ActivityType, { icon: typeof CheckCircle2; className: string }> = {
  applied: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
  interview_scheduled: { icon: CalendarClock, className: "bg-blue-50 text-blue-600" },
  not_moved_forward: { icon: XCircle, className: "bg-red-50 text-red-500" },
  hired: { icon: PartyPopper, className: "bg-brand-50 text-brand-600" },
  job_saved: { icon: Bookmark, className: "bg-slate-100 text-slate-500" },
  cover_letter_generated: { icon: Sparkles, className: "bg-accent-500/10 text-accent-600" },
  follow_up_due: { icon: Clock, className: "bg-amber-50 text-amber-600" },
};

export function RecentActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((item, i) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        return (
          <li key={`${item.type}-${item.at}-${i}`} className="flex items-start gap-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(item.at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
