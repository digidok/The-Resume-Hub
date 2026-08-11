"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Layers,
  Sparkles,
  FileText,
  Mail,
  ScanSearch,
  Bookmark,
  MessageSquare,
  Bell,
  DollarSign,
  Zap,
  Import,
  UserCog,
  Briefcase,
  PlusSquare,
  Globe,
  CalendarClock,
  Users,
  GraduationCap,
  BarChart3,
  IdCard,
  CreditCard,
  Newspaper,
} from "lucide-react";

// Server Components can't pass component/function references as props to
// Client Components (RSC serialization boundary) — so nav items carry an
// icon *name* string, and this map resolves it to the actual icon
// component here, inside the client boundary.
const ICONS = {
  LayoutDashboard,
  Search,
  ClipboardList,
  Layers,
  Sparkles,
  FileText,
  Mail,
  ScanSearch,
  Bookmark,
  MessageSquare,
  Bell,
  DollarSign,
  Zap,
  Import,
  UserCog,
  Briefcase,
  PlusSquare,
  Globe,
  CalendarClock,
  Users,
  GraduationCap,
  BarChart3,
  IdCard,
  CreditCard,
  Newspaper,
} as const;

export type NavIconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: NavIconName };
export type NavGroup = { label: string; items: NavItem[] };

export function DashboardNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.label}
          </p>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active =
                item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-800"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brand-700" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
