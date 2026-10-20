"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard/admin/business/recruitment", label: "Talent pool", exact: true },
  { href: "/dashboard/admin/business/recruitment/import", label: "Import CVs" },
  { href: "/dashboard/admin/business/recruitment/vacancies", label: "Vacancies" },
  { href: "/dashboard/admin/business/recruitment/placements", label: "Placements and payroll" },
];

export function RecruitmentNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-5 flex flex-wrap gap-4 border-b border-slate-200" aria-label="Recruitment sections">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium ${
              active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
