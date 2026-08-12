"use client";

import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";
import { useSidebarCollapsed } from "@/components/dashboard/sidebar-context";

export function SidebarPlanCard({
  role,
  plan,
  creditsRemaining,
  jobPostingCredits,
}: {
  role: "candidate" | "employer" | "admin";
  plan?: string | null;
  creditsRemaining?: number | null;
  jobPostingCredits?: number | null;
}) {
  const collapsed = useSidebarCollapsed();

  if (role === "admin") {
    return (
      <div
        className={`mb-4 flex items-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm text-brand-800 ${
          collapsed ? "justify-center px-2" : "px-3"
        }`}
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">Admin access</span>}
      </div>
    );
  }

  return (
    <Link
      href="/dashboard/subscription"
      title={collapsed ? `${plan ?? "free"} plan` : undefined}
      className={`mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 py-2.5 text-sm ring-1 ring-brand-100 transition hover:ring-brand-200 ${
        collapsed ? "justify-center px-2" : "px-3"
      }`}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-brand-600" />
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold capitalize text-brand-800">{plan ?? "free"} plan</span>
          <span className="block truncate text-xs text-brand-600">
            {role === "employer"
              ? `${jobPostingCredits ?? 0} job posts left`
              : `${creditsRemaining ?? 0} AI credits left`}
          </span>
        </span>
      )}
    </Link>
  );
}
