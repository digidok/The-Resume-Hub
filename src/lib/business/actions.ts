"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { TEAM_EMAIL, emailBody, esc, sendEmail } from "@/lib/business/notify";

const BILLING_STATUSES = ["draft", "sent", "accepted", "declined", "paid", "cancelled"] as const;
const REQUEST_STATUSES = ["new", "in_progress", "delivered", "cancelled"] as const;
const CHECK_STATUSES = ["requested", "in_progress", "completed", "discrepancy"] as const;
const PRIVACY_STATUSES = ["new", "in_progress", "completed", "refused"] as const;

type Admin = { supabase: SupabaseClient; user: User };

async function requireAdmin(): Promise<Admin> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, user };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  return { supabase, user, email: user.email.toLowerCase() };
}

/** Append-only record of sensitive staff actions. Never blocks the action itself. */
async function audit(
  { supabase, user }: Admin,
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {}
) {
  const { error } = await supabase
    .from("audit_log")
    .insert({ actor_id: user.id, actor_email: user.email, action, entity, entity_id: entityId, meta });
  if (error) console.error("audit log write failed", action, error.message);
}

function text(form: FormData, key: string, max = 500): string {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function money(form: FormData, key: string): number | null {
  const n = Number(String(form.get(key) ?? "").replace(/[\s,]/g, ""));
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? n : null;
}

function refreshBusiness() {
  revalidatePath("/dashboard/admin/business", "layout");
  revalidatePath("/dashboard/business", "layout");
}

// ---- Client -------------------------------------------------------------

export async function respondToQuote(id: string, accept: boolean) {
  const { supabase, email } = await requireUser();
  const { data: quote } = await supabase.from("business_billing").select("number, client_name").eq("id", id).maybeSingle();
  const { error } = await supabase.rpc("respond_to_quote", { p_id: id, p_accept: accept });
  if (!error && quote) {
    await sendEmail({
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `Quote ${quote.number} ${accept ? "accepted" : "declined"} by ${quote.client_name}`,
      html: `<p>${esc(quote.client_name)} (${esc(email)}) ${accept ? "accepted" : "declined"} quote <strong>${esc(quote.number)}</strong>.</p>`,
    });
  }
  refreshBusiness();
}

export async function approveDelivery(reference: string) {
  const { supabase, email } = await requireUser();
  const { error } = await supabase.rpc("approve_delivery", { p_reference: reference });
  if (!error) {
    await sendEmail({
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `Delivery approved: ${reference}`,
      html: `<p>${esc(email)} approved the delivered work for <strong>${esc(reference)}</strong>.</p>`,
    });
  }
  refreshBusiness();
}

export async function leaveFeedback(requestId: string, form: FormData) {
  const { supabase } = await requireUser();
  const rating = Number(form.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
  await supabase.from("business_feedback").insert({ request_id: requestId, rating, comment: text(form, "comment", 2000) || null });
  refreshBusiness();
}

export async function sendClientMessage(requestId: string, reference: string, form: FormData) {
  const { supabase, email } = await requireUser();
  const body = text(form, "body", 4000);
  if (!body) return;
  const { error } = await supabase
    .from("business_messages")
    .insert({ request_id: requestId, sender_role: "client", sender_email: email, body });
  if (!error) {
    await sendEmail({
      to: TEAM_EMAIL,
      replyTo: email,
      subject: `New client message on ${reference}`,
      html: `<p><strong>${esc(email)}</strong> on ${esc(reference)}:</p><p>${esc(body).replace(/\n/g, "<br>")}</p>`,
    });
  }
  refreshBusiness();
}

export async function addBusinessMember(form: FormData) {
  const { supabase, email } = await requireUser();
  const member = text(form, "member_email", 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member) || member === email) return;
  await supabase.from("business_members").insert({ owner_email: email, member_email: member });
  await sendEmail({
    to: member,
    subject: `${email} gave you access to their business dashboard`,
    html: emailBody("there", [
      `${esc(email)} has authorised you to view their requests, files, quotes, invoices and retainer hours with The Resume Document Hub.`,
      "Sign in or create an account using this email address to see it.",
    ], { path: "/dashboard/business", label: "Open the dashboard" }),
  });
  revalidatePath("/dashboard/business", "layout");
}

export async function removeBusinessMember(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("business_members").delete().eq("id", id);
  revalidatePath("/dashboard/business", "layout");
}

// ---- Team (admin): requests, billing, files -------------------------------

export async function setRequestStatus(id: string, status: string) {
  if (!(REQUEST_STATUSES as readonly string[]).includes(status)) return;
  const admin = await requireAdmin();
  const { data: req } = await admin.supabase
    .from("studio_requests")
    .update({ status })
    .eq("id", id)
    .select("reference, email, contact_name")
    .single();
  await audit(admin, "request.status", "studio_request", id, { status });
  if (req) {
    const label = { new: "received", in_progress: "in progress", delivered: "delivered", cancelled: "cancelled" }[status];
    await sendEmail({
      to: req.email,
      replyTo: TEAM_EMAIL,
      subject: `Your request ${req.reference} is ${label}`,
      html: emailBody(req.contact_name, [`Your request <strong>${esc(req.reference)}</strong> is now <strong>${label}</strong>.`],
        { path: `/dashboard/business/${req.reference}`, label: "View your request" }),
    });
  }
  refreshBusiness();
}

export async function createBilling(requestId: string | null, form: FormData) {
  const admin = await requireAdmin();
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

  const { data } = await admin.supabase
    .from("business_billing")
    .insert({
      request_id: requestId,
      client_email: clientEmail,
      client_name: clientName,
      kind,
      number,
      description,
      amount_zar: amount,
      status: "draft",
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(dueRaw) ? dueRaw : null,
    })
    .select("id")
    .single();
  await audit(admin, "billing.create", "business_billing", data?.id ?? null, { kind, number, amount });
  refreshBusiness();
}

export async function setBillingStatus(id: string, status: string) {
  if (!(BILLING_STATUSES as readonly string[]).includes(status)) return;
  const admin = await requireAdmin();
  const { data: b } = await admin.supabase
    .from("business_billing")
    .update({ status, ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}) })
    .eq("id", id)
    .select("kind, number, client_email, client_name, amount_zar")
    .single();
  await audit(admin, "billing.status", "business_billing", id, { status, number: b?.number });
  if (b && status === "sent") {
    await sendEmail({
      to: b.client_email,
      replyTo: TEAM_EMAIL,
      subject: `${b.kind === "quote" ? "Quotation" : "Invoice"} ${b.number} from The Resume Document Hub`,
      html: emailBody(b.client_name, [
        `Your ${b.kind} <strong>${esc(b.number)}</strong> for <strong>R${Number(b.amount_zar).toLocaleString("en-ZA")}</strong> is ready.`,
        b.kind === "quote" ? "Please review it and accept or decline from your dashboard. Work starts once you approve the scope." : "You can pay online or by EFT using the invoice number as your reference.",
      ], { path: "/dashboard/business", label: "Open your dashboard" }),
    });
  }
  refreshBusiness();
}

export async function addDeliverable(requestId: string, name: string, storagePath: string) {
  const admin = await requireAdmin();
  await admin.supabase
    .from("business_deliverables")
    .insert({ request_id: requestId, name: name.slice(0, 200), storage_path: storagePath });
  await audit(admin, "deliverable.add", "studio_request", requestId, { name });
  const { data: req } = await admin.supabase.from("studio_requests").select("reference, email, contact_name").eq("id", requestId).single();
  if (req) {
    await sendEmail({
      to: req.email,
      replyTo: TEAM_EMAIL,
      subject: `A new document is ready for ${req.reference}`,
      html: emailBody(req.contact_name, [`We have added <strong>${esc(name)}</strong> to your request ${esc(req.reference)}.`],
        { path: `/dashboard/business/${req.reference}`, label: "Download it" }),
    });
  }
  refreshBusiness();
}

export async function removeDeliverable(id: string) {
  const admin = await requireAdmin();
  const { data } = await admin.supabase.from("business_deliverables").select("storage_path, name").eq("id", id).single();
  if (data?.storage_path) await admin.supabase.storage.from("studio-deliveries").remove([data.storage_path]);
  await admin.supabase.from("business_deliverables").delete().eq("id", id);
  await audit(admin, "deliverable.remove", "business_deliverable", id, { name: data?.name });
  refreshBusiness();
}

export async function sendTeamMessage(requestId: string, reference: string, clientEmail: string, form: FormData) {
  const admin = await requireAdmin();
  const body = text(form, "body", 4000);
  if (!body) return;
  await admin.supabase
    .from("business_messages")
    .insert({ request_id: requestId, sender_role: "team", sender_email: admin.user.email ?? TEAM_EMAIL, body });
  await sendEmail({
    to: clientEmail,
    replyTo: TEAM_EMAIL,
    subject: `New message about ${reference}`,
    html: emailBody("there", [esc(body).replace(/\n/g, "<br>")], { path: `/dashboard/business/${reference}`, label: "Reply in your dashboard" }),
  });
  refreshBusiness();
}

// ---- Team (admin): retainers and contracts --------------------------------

export async function createRetainer(form: FormData) {
  const admin = await requireAdmin();
  const hours = money(form, "monthly_hours");
  const fee = money(form, "monthly_fee");
  const clientEmail = text(form, "client_email", 200).toLowerCase();
  const company = text(form, "company_name", 200);
  const plan = text(form, "plan_name", 200);
  const kind = text(form, "kind") === "corporate_contract" ? "corporate_contract" : "retainer";
  const endRaw = text(form, "end_date", 10);
  if (!hours || hours <= 0 || fee === null || !clientEmail || !company || !plan) return;
  const { data } = await admin.supabase
    .from("business_retainers")
    .insert({
      client_email: clientEmail,
      company_name: company,
      plan_name: plan,
      monthly_hours: hours,
      monthly_fee_zar: fee,
      kind,
      end_date: /^\d{4}-\d{2}-\d{2}$/.test(endRaw) ? endRaw : null,
    })
    .select("id")
    .single();
  await audit(admin, "retainer.create", "business_retainer", data?.id ?? null, { company, plan, hours, fee, kind });
  refreshBusiness();
}

export async function logTime(retainerId: string, form: FormData) {
  const admin = await requireAdmin();
  const hours = money(form, "hours");
  const description = text(form, "description", 300);
  const dateRaw = text(form, "entry_date", 10);
  if (!hours || hours <= 0 || hours > 24 || !description) return;
  await admin.supabase.from("business_time_entries").insert({
    retainer_id: retainerId,
    hours,
    description,
    ...(/^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? { entry_date: dateRaw } : {}),
  });
  await audit(admin, "time.log", "business_retainer", retainerId, { hours });
  refreshBusiness();
}

export async function setRetainerActive(id: string, active: boolean) {
  const admin = await requireAdmin();
  await admin.supabase.from("business_retainers").update({ active }).eq("id", id);
  await audit(admin, "retainer.active", "business_retainer", id, { active });
  refreshBusiness();
}

// ---- Team (admin): enquiries, tasks, pricing, privacy ----------------------

export async function setEnquiryStatus(id: string, status: string) {
  if (!["new", "contacted", "quoted", "won", "lost"].includes(status)) return;
  const admin = await requireAdmin();
  await admin.supabase.from("business_enquiries").update({ status }).eq("id", id);
  await audit(admin, "enquiry.status", "business_enquiry", id, { status });
  refreshBusiness();
}

export async function createTask(form: FormData) {
  const admin = await requireAdmin();
  const title = text(form, "title", 200);
  if (!title) return;
  const assigned = text(form, "assigned_to", 60);
  const dueRaw = text(form, "due_date", 10);
  const requestId = text(form, "request_id", 60);
  const { data } = await admin.supabase
    .from("business_tasks")
    .insert({
      title,
      assigned_to: assigned || null,
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(dueRaw) ? dueRaw : null,
      request_id: requestId || null,
    })
    .select("id")
    .single();
  await audit(admin, "task.create", "business_task", data?.id ?? null, { title, assigned });
  refreshBusiness();
}

export async function setTaskStatus(id: string, status: string) {
  if (!["todo", "doing", "done"].includes(status)) return;
  const admin = await requireAdmin();
  await admin.supabase.from("business_tasks").update({ status }).eq("id", id);
  await audit(admin, "task.status", "business_task", id, { status });
  refreshBusiness();
}

export async function saveCatalogOverride(form: FormData) {
  const admin = await requireAdmin();
  const serviceId = text(form, "service_id", 60);
  if (!serviceId) return;
  const priceRaw = text(form, "from_zar", 20);
  const price = priceRaw === "" ? null : money(form, "from_zar");
  if (priceRaw !== "" && price === null) return;
  await admin.supabase.from("catalog_overrides").upsert({
    service_id: serviceId,
    from_zar: price,
    quote_only: form.get("quote_only") === "on",
    available: form.get("available") === "on",
    updated_at: new Date().toISOString(),
  });
  await audit(admin, "catalog.override", "catalog_service", serviceId, {
    from_zar: price,
    quote_only: form.get("quote_only") === "on",
    available: form.get("available") === "on",
  });
  for (const path of ["/pricing", "/solutions", "/careers", "/services"]) revalidatePath(path);
  revalidatePath("/solutions/[slug]", "page");
  revalidatePath("/dashboard/admin/business/pricing");
}

export async function clearCatalogOverride(serviceId: string) {
  const admin = await requireAdmin();
  await admin.supabase.from("catalog_overrides").delete().eq("service_id", serviceId);
  await audit(admin, "catalog.reset", "catalog_service", serviceId);
  for (const path of ["/pricing", "/solutions", "/careers", "/services"]) revalidatePath(path);
  revalidatePath("/solutions/[slug]", "page");
  revalidatePath("/dashboard/admin/business/pricing");
}

export async function setPrivacyStatus(id: string, status: string) {
  if (!(PRIVACY_STATUSES as readonly string[]).includes(status)) return;
  const admin = await requireAdmin();
  await admin.supabase
    .from("privacy_requests")
    .update({ status, handled_at: status === "completed" || status === "refused" ? new Date().toISOString() : null })
    .eq("id", id);
  await audit(admin, "privacy.status", "privacy_request", id, { status });
  revalidatePath("/dashboard/admin/business/privacy");
}

// ---- Team (admin): background screening -----------------------------------

function screeningRef(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `SCR-${out}`;
}

export async function createScreeningCase(form: FormData) {
  const admin = await requireAdmin();
  const clientEmail = text(form, "client_email", 200).toLowerCase();
  const clientName = text(form, "client_name", 200);
  const candidate = text(form, "candidate_name", 200);
  const purpose = text(form, "lawful_purpose", 1000);
  const checks = form.getAll("checks").map(String).filter(Boolean).slice(0, 12);
  if (!clientEmail || !clientName || !candidate || !purpose || checks.length === 0) return;

  const { data } = await admin.supabase
    .from("screening_cases")
    .insert({
      reference: screeningRef(),
      client_email: clientEmail,
      client_name: clientName,
      candidate_name: candidate,
      role_title: text(form, "role_title", 200) || null,
      lawful_purpose: purpose,
    })
    .select("id, reference")
    .single();
  if (data) {
    await admin.supabase.from("screening_checks").insert(checks.map((c) => ({ case_id: data.id, check_type: c })));
    await audit(admin, "screening.create", "screening_case", data.id, { reference: data.reference, checks: checks.length });
  }
  refreshBusiness();
}

export async function recordConsent(caseId: string, status: string, form: FormData) {
  if (!["pending", "received", "declined"].includes(status)) return;
  const admin = await requireAdmin();
  await admin.supabase
    .from("screening_cases")
    .update({
      consent_status: status,
      consent_received_at: status === "received" ? new Date().toISOString() : null,
      consent_method: status === "received" ? text(form, "method", 200) || "Recorded by staff" : null,
    })
    .eq("id", caseId);
  await audit(admin, "screening.consent", "screening_case", caseId, { status });
  refreshBusiness();
}

export async function setCheckStatus(checkId: string, caseId: string, status: string) {
  if (!(CHECK_STATUSES as readonly string[]).includes(status)) return;
  const admin = await requireAdmin();
  // Checks must not start until the candidate's consent is on record.
  if (status !== "requested") {
    const { data: c } = await admin.supabase.from("screening_cases").select("consent_status").eq("id", caseId).single();
    if (c?.consent_status !== "received") return;
  }
  await admin.supabase
    .from("screening_checks")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkId);
  const { data: all } = await admin.supabase.from("screening_checks").select("status").eq("case_id", caseId);
  const statuses = (all ?? []).map((r: { status: string }) => r.status);
  const caseStatus = statuses.every((s) => s === "completed")
    ? "completed"
    : statuses.some((s) => s !== "requested")
      ? "in_progress"
      : "requested";
  await admin.supabase.from("screening_cases").update({ status: caseStatus }).eq("id", caseId);
  await audit(admin, "screening.check", "screening_check", checkId, { status });
  refreshBusiness();
}

export async function saveDisputeNote(caseId: string, form: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("screening_cases").update({ dispute_note: text(form, "dispute_note", 2000) || null }).eq("id", caseId);
  await audit(admin, "screening.dispute", "screening_case", caseId);
  refreshBusiness();
}

export async function addScreeningReport(caseId: string, _name: string, storagePath: string) {
  const admin = await requireAdmin();
  await admin.supabase.from("screening_cases").update({ report_path: storagePath }).eq("id", caseId);
  await audit(admin, "screening.report", "screening_case", caseId);
  refreshBusiness();
}
