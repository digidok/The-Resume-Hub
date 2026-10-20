import { DOCUMENT_GROUPS } from "@/lib/studio/catalog";

export type RequestStatus = "new" | "in_progress" | "delivered" | "cancelled";
export type BillingStatus = "draft" | "sent" | "accepted" | "declined" | "paid" | "cancelled";

export type StoredFile = { kind: string; name: string; size?: number; type?: string; path: string };

export type StudioRequestRow = {
  id: string;
  reference: string;
  status: RequestStatus;
  document_type: string;
  template_style: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  deadline: string | null;
  brief: string | null;
  files: StoredFile[];
  approved_at?: string | null;
  created_at: string;
};

export type BillingRow = {
  id: string;
  request_id: string | null;
  client_email: string;
  client_name: string;
  kind: "quote" | "invoice";
  number: string;
  description: string;
  amount_zar: number;
  status: BillingStatus;
  due_date: string | null;
  paid_at?: string | null;
  created_at: string;
};

export type RetainerRow = {
  id: string;
  client_email: string;
  company_name: string;
  plan_name: string;
  monthly_hours: number;
  monthly_fee_zar: number;
  start_date: string;
  end_date?: string | null;
  kind?: "retainer" | "corporate_contract";
  active: boolean;
};

export type TimeEntryRow = {
  id: string;
  retainer_id: string;
  entry_date: string;
  hours: number;
  description: string;
};

export type DeliverableRow = {
  id: string;
  request_id: string;
  name: string;
  storage_path: string;
  created_at: string;
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  new: "Received",
  in_progress: "In progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const REQUEST_STATUS_STYLE: Record<RequestStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export const BILLING_STATUS_LABEL: Record<BillingStatus, string> = {
  draft: "Draft",
  sent: "Awaiting you",
  accepted: "Accepted",
  declined: "Declined",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const BILLING_STATUS_STYLE: Record<BillingStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const DOC_LABELS = new Map(
  DOCUMENT_GROUPS.flatMap((g) => g.options.map((o) => [o.id, o.label] as const))
);

export function documentLabel(id: string): string {
  return DOC_LABELS.get(id) ?? id;
}

export function formatZar(amount: number | string): string {
  const n = Number(amount);
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/** Hours logged in the calendar month containing `now`. */
export function hoursThisMonth(entries: TimeEntryRow[], now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth();
  return entries.reduce((sum, e) => {
    const d = new Date(e.entry_date);
    return d.getFullYear() === y && d.getMonth() === m ? sum + Number(e.hours) : sum;
  }, 0);
}

export type MessageRow = {
  id: string;
  request_id: string;
  sender_role: "client" | "team";
  sender_email: string;
  body: string;
  created_at: string;
};

export type ScreeningCaseRow = {
  id: string;
  reference: string;
  client_email: string;
  client_name: string;
  candidate_name: string;
  role_title: string | null;
  lawful_purpose: string;
  consent_status: "pending" | "received" | "declined";
  consent_received_at: string | null;
  consent_method: string | null;
  status: "requested" | "in_progress" | "completed" | "cancelled";
  dispute_note: string | null;
  report_path: string | null;
  created_at: string;
};

export type ScreeningCheckRow = {
  id: string;
  case_id: string;
  check_type: string;
  status: "requested" | "in_progress" | "completed" | "discrepancy";
  completed_at: string | null;
};

export const CHECK_STATUS_LABEL: Record<ScreeningCheckRow["status"], string> = {
  requested: "Requested",
  in_progress: "In progress",
  completed: "Completed",
  discrepancy: "Under review",
};

export const CHECK_STATUS_STYLE: Record<ScreeningCheckRow["status"], string> = {
  requested: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-700",
  discrepancy: "bg-blue-100 text-blue-700",
};
