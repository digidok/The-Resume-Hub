"use client";

import { MessageCircle, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { useSidebarCollapsed } from "@/components/dashboard/sidebar-context";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SidebarFooter({
  name,
  role,
  showWhatsApp,
}: {
  name: string;
  role: string;
  showWhatsApp: boolean;
}) {
  const collapsed = useSidebarCollapsed();

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      {showWhatsApp && !collapsed && (
        <a
          href="https://wa.me/27693391915"
          target="_blank"
          rel="noreferrer"
          className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Need help? Chat on WhatsApp
        </a>
      )}

      <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials(name)}
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{name}</p>
            <p className="truncate text-xs capitalize text-slate-500">{role}</p>
          </div>
        )}
      </div>

      <form action={signOut} className="mt-3">
        <button
          type="submit"
          title={collapsed ? "Sign out" : undefined}
          className={`flex w-full items-center gap-2 rounded-lg border border-slate-200 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 ${
            collapsed ? "justify-center px-0" : "justify-center px-3"
          }`}
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && "Sign out"}
        </button>
      </form>
    </div>
  );
}
