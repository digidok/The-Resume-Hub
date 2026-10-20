import {
  BILLING_STATUS_LABEL,
  BILLING_STATUS_STYLE,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_STYLE,
  type BillingStatus,
  type RequestStatus,
} from "@/lib/business/format";

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`${base} ${REQUEST_STATUS_STYLE[status]}`}>{REQUEST_STATUS_LABEL[status]}</span>;
}

export function BillingStatusBadge({ status, admin = false }: { status: BillingStatus; admin?: boolean }) {
  const label = admin && status === "sent" ? "Sent to client" : BILLING_STATUS_LABEL[status];
  return <span className={`${base} ${BILLING_STATUS_STYLE[status]}`}>{label}</span>;
}

export function HoursMeter({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const over = used > total;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-slate-900">
          {used.toFixed(1)} <span className="font-normal text-slate-500">of {total} hours used</span>
        </span>
        <span className={over ? "font-semibold text-red-600" : "text-slate-500"}>
          {over ? `${(used - total).toFixed(1)} over` : `${(total - used).toFixed(1)} left`}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${over ? "bg-red-500" : pct > 85 ? "bg-amber-500" : "bg-brand-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
