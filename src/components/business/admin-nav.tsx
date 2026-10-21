"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/admin/business/tracker", label: "Tracker" },
  { href: "/dashboard/admin/business", label: "Requests", exact: true },
  { href: "/dashboard/admin/business/enquiries", label: "Enquiries" },
  { href: "/dashboard/admin/business/appointments", label: "Appointments" },
  { href: "/dashboard/admin/business/recruitment", label: "Recruitment" },
  { href: "/dashboard/admin/business/screening", label: "Screening" },
  { href: "/dashboard/admin/business/tasks", label: "Tasks" },
  { href: "/dashboard/admin/business/retainers", label: "Retainers" },
  { href: "/dashboard/admin/business/clients", label: "Clients" },
  { href: "/dashboard/admin/business/pricing", label: "Pricing" },
  { href: "/dashboard/admin/business/reports", label: "Reports" },
  { href: "/dashboard/admin/business/privacy", label: "Privacy" },
  { href: "/dashboard/admin/business/staff", label: "Staff" },
  { href: "/dashboard/admin/business/audit", label: "Audit log" },
];

export function BusinessAdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-1.5" aria-label="Business hub sections">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              active ? "bg-brand-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
