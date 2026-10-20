"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const BILLING_STATUSES = ["draft", "sent", "accepted", "declined", "paid", "cancelled"] as const;
const REQUEST_STATUSES = ["new", "in_progress", "delivered", "cancelled"] as const;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

function text(form: FormData, key: string, max = 500): string {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function money(form: FormData, key: string): number | null {
  const n = Number(String(form.get(key) ?? "").replace(/[\s,]/g, ""));
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? n : null;
}

// ---- Client -------------------------------------------------------------

export async function respondToQuote(id: string, accept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.rpc("respond_to_quote", { p_id: id, p_accept: accept });
  revalidatePath("/dashboard/business", "layout");
}

// ---- Team (admin) -------------------------------------------------------

export async function setRequestStatus(id: string, status: string) {
  if (!(REQUEST_STATUSES as readonly string[]).includes(status)) return;
  const supabase = await requireAdmin();
  await supabase.from("studio_requests").update({ status }).eq("id", id);
  revalidatePath("/dashboard/admin/business", "layout");
  revalidatePath("/dashboard/business", "layout");
}

export async function createBilling(requestId: string | null, form: FormData) {
  const supabase = await requireAdmin();
  const kind = text(form, "kind") === "invoice" ? "invoice" : "quote";
  const amount = money(form, "amount");
  const description = text(form, "description", 500);
  const clientEmail = text(form, "client_email", 200).toLowerCase();
  const clientName = text(form, "client_name", 200);
  if (amount === null || !description || !clientEmail || !clientName) return;
  const dueRaw = text(form, "due_date", 10);

  const number = `${kind === "quote" ? "QT" : "INV"}-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

  await supabase.from("business_billing").insert({
    request_id: requestId,
    client_email: clientEmail,
    client_name: clientName,
    kind,
    number,
    description,
    amount_zar: amount,
    status: "draft",
    due_date: /^\d{4}-\d{2}-\d{2}$/.test(dueRaw) ? dueRaw : null,
  });
  revalidatePath("/dashboard/admin/business", "layout");
}

export async function setBillingStatus(id: string, status: string) {
  if (!(BILLING_STATUSES as readonly string[]).includes(status)) return;
  const supabase = await requireAdmin();
  await supabase.from("business_billing").update({ status }).eq("id", id);
  revalidatePath("/dashboard/admin/business", "layout");
  revalidatePath("/dashboard/business", "layout");
}

export async function addDeliverable(requestId: string, name: string, storagePath: string) {
  const supabase = await requireAdmin();
  await supabase
    .from("business_deliverables")
    .insert({ request_id: requestId, name: name.slice(0, 200), storage_path: storagePath });
  revalidatePath("/dashboard/admin/business", "layout");
  revalidatePath("/dashboard/business", "layout");
}

export async function removeDeliverable(id: string) {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("business_deliverables").select("storage_path").eq("id", id).single();
  if (data?.storage_path) await supabase.storage.from("studio-deliveries").remove([data.storage_path]);
  await supabase.from("business_deliverables").delete().eq("id", id);
  revalidatePath("/dashboard/admin/business", "layout");
  revalidatePath("/dashboard/business", "layout");
}

export async function createRetainer(form: FormData) {
  const supabase = await requireAdmin();
  const hours = money(form, "monthly_hours");
  const fee = money(form, "monthly_fee");
  const clientEmail = text(form, "client_email", 200).toLowerCase();
  const company = text(form, "company_name", 200);
  const plan = text(form, "plan_name", 200);
  if (!hours || hours <= 0 || fee === null || !clientEmail || !company || !plan) return;
  await supabase.from("business_retainers").insert({
    client_email: clientEmail,
    company_name: company,
    plan_name: plan,
    monthly_hours: hours,
    monthly_fee_zar: fee,
  });
  revalidatePath("/dashboard/admin/business", "layout");
}

export async function logTime(retainerId: string, form: FormData) {
  const supabase = await requireAdmin();
  const hours = money(form, "hours");
  const description = text(form, "description", 300);
  const dateRaw = text(form, "entry_date", 10);
  if (!hours || hours <= 0 || hours > 24 || !description) return;
  await supabase.from("business_time_entries").insert({
    retainer_id: retainerId,
    hours,
    description,
    ...(/^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? { entry_date: dateRaw } : {}),
  });
  revalidatePath("/dashboard/admin/business", "layout");
  revalidatePath("/dashboard/business", "layout");
}

export async function setRetainerActive(id: string, active: boolean) {
  const supabase = await requireAdmin();
  await supabase.from("business_retainers").update({ active }).eq("id", id);
  revalidatePath("/dashboard/admin/business", "layout");
  revalidatePath("/dashboard/business", "layout");
}

export async function setEnquiryStatus(id: string, status: string) {
  if (!["new", "contacted", "quoted", "won", "lost"].includes(status)) return;
  const supabase = await requireAdmin();
  await supabase.from("business_enquiries").update({ status }).eq("id", id);
  revalidatePath("/dashboard/admin/business", "layout");
}
