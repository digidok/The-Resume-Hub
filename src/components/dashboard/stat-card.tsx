import Link from "next/link";
import { ArrowUpRight, TriangleAlert, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type Trend = { text: string; tone?: "positive" | "warning" };

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  href,
  hint,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: Trend;
  href?: string;
  /** @deprecated pass `trend` instead */
  hint?: string;
}) {
  const warning = trend?.tone === "warning";

  const content = (
    <Card className={`p-4 ${href ? "transition hover:-translate-y-0.5 hover:shadow-md" : ""}`}>
      <div className="flex items-start justify-between">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="h-4 w-4" />
          </span>
        )}
        {href &&
          (warning ? (
            <TriangleAlert className="h-4 w-4 text-amber-500" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-slate-300" />
          ))}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {(trend || hint) && (
        <p className={`mt-1 text-xs font-medium ${warning ? "text-amber-600" : "text-emerald-600"}`}>
          {trend?.text ?? hint}
        </p>
      )}
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
