import { Sparkles } from "lucide-react";
import { CommandSearch } from "@/components/dashboard/command-search";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { AvatarMenu } from "@/components/dashboard/avatar-menu";
import { AskElsButton } from "@/components/ask-els/ask-els-button";
import type { Notification } from "@/types/database";

const LOW_CREDITS_THRESHOLD = 10;

export function DashboardHeader({
  name,
  email,
  role,
  creditsRemaining,
  notifications,
  avatarUrl,
}: {
  name: string;
  email: string;
  role: string;
  creditsRemaining: number | null;
  notifications: Notification[];
  avatarUrl?: string | null;
}) {
  const low = creditsRemaining != null && creditsRemaining < LOW_CREDITS_THRESHOLD;

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex-1">
        <CommandSearch />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {creditsRemaining != null && (
          <span
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex ${
              low ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {creditsRemaining} credits
          </span>
        )}
        <AskElsButton />
        <NotificationBell notifications={notifications} />
        <AvatarMenu name={name} email={email} role={role} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
