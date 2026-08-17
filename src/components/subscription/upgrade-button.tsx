import Link from "next/link";
import { Crown } from "lucide-react";

export function UpgradeButton() {
  return (
    <Link
      href="/dashboard/subscription"
      className="flex items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600 sm:text-sm"
    >
      <Crown className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Upgrade</span>
    </Link>
  );
}
