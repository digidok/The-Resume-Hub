"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { requireStaff } from "@/lib/business/guard";
import { SITE_URL, TEAM_EMAIL, esc, sendEmail } from "@/lib/business/notify";
import { mapTalentCsv, parseCsv } from "@/lib/recruitment/csv";

const STAGES = ["sourced", "shortlisted", "interview", "offered", "placed", "rejected", "withdrawn"] as const;
const VACANCY_STATUSES = ["open", "on_hold", "filled", "closed"] as const;
const EMPLOYMENT_TYPES = ["temporary", "fixed_term", "permanent", "project"] as const;
const MAX_IMPORT_BYTES = 6 * 1024 * 1024;
const MAX_IMPORT_ROWS = 25_000;
const MAX_BULK_EMAIL = 200;
const BATCH = 500;

function text(form: FormData, key: string, max: number): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function ids(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((v): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v))
    .slice(0, 2000);
}
function ref(prefix: string): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${out}`;
}
async function audit(
  { supabase, user }: { supabase: SupabaseClient; user: User },
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {}
) {
  try {
    await supabase.from("audit_log").insert({ actor_id: user.id, actor_email: user.email ?? null, action, entity, entity_id: entityId, meta });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}

// --- Import ---------------------------------------------------------------------

/** Imports candidates from a CSV. Contact is only allowed for rows marked as having consented. */
export async function importTalentCsv(form: FormData) {
  const staff = await requireStaff(["recruiter"]);
  const file = form.get("file");
  const source = text(form, "source", 120) || "CSV import";
  const confirmed = form.get("confirm") === "on";
  const back = "/dashboard/admin/business/recruitment/import";
  if (!confirmed) redirect(`${back}?error=${encodeURIComponent("Please confirm the consent statement first.")}`);
  if (!(file instanceof File) || file.size === 0) redirect(`${back}?error=${encodeURIComponent("Choose a CSV file.")}`);
  if (file.size > MAX_IMPORT_BYTES) redirect(`${back}?error=${encodeURIComponent("File is too large (6 MB maximum). Split it and import in parts.")}`);

  const parsed = mapTalentCsv(parseCsv(await file.text()));
  if (parsed.missingColumns.length) {
    redirect(`${back}?error=${encodeURIComponent(`The file is missing: ${parsed.missingColumns.join(", ")}.`)}`);
  }
  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    redirect(`${back}?error=${encodeURIComponent(`Too many rows (${MAX_IMPORT_ROWS.toLocaleString("en-ZA")} maximum per file).`)}`);
  }

  const now = new Date().toISOString();
  let saved = 0;
  for (let i = 0; i < parsed.rows.length; i += BATCH) {
    const batch = parsed.rows.slice(i, i + BATCH).map((r) => ({
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      location: r.location,
      headline: r.headline,
      skills: r.skills,
      experience_years: r.experience_years,
      availability: r.availability,
      source,
      consent_status: r.consent_given ? "given" : "pending",
      consent_at: r.consent_given ? now : null,
    }));
    // Rows with an email are matched on it: people already in the pool are left unchanged. Rows without one are always added.
    const withEmail = batch.filter((b) => b.email);
    const withoutEmail = batch.filter((b) => !b.email);
    if (withEmail.length) {
      const { error } = await staff.supabase.from("talent_pool").upsert(withEmail, { onConflict: "email", ignoreDuplicates: true });
      if (error) redirect(`${back}?error=${encodeURIComponent("Import stopped: " + error.message)}`);
    }
    if (withoutEmail.length) {
      const { error } = await staff.supabase.from("talent_pool").insert(withoutEmail);
      if (error) redirect(`${back}?error=${encodeURIComponent("Import stopped: " + error.message)}`);
    }
    saved += batch.length;
  }
  await audit(staff, "talent.import", "talent_pool", null, { source, rows: saved, skipped: parsed.skipped.length });
  revalidatePath("/dashboard/admin/business/recruitment");
  redirect(`${back}?done=${saved}&skipped=${parsed.skipped.length}`);
}

export async function updateTalentConsent(id: string, status: string) {
  if (!["given", "pending", "withdrawn"].includes(status)) return;
  const staff = await requireStaff(["recruiter"]);
  await staff.supabase
    .from("talent_pool")
    .update({ consent_status: status, consent_at: status === "given" ? new Date().toISOString() : null })
    .eq("id", id);
  await audit(staff, "talent.consent", "talent_pool", id, { status });
  revalidatePath("/dashboard/admin/business/recruitment");
}

// --- Vacancies and pipeline ------------------------------------------------------

export async function createVacancy(form: FormData) {
  const staff = await requireStaff(["recruiter"]);
  const client = text(form, "client_name", 160);
  const title = text(form, "title", 200);
  if (!client || !title) return;
  const type = text(form, "employment_type", 20);
  const headcount = Math.max(1, Math.min(10000, parseInt(text(form, "headcount", 6), 10) || 1));
  const startRaw = text(form, "start_date", 10);
  const { data } = await staff.supabase
    .from("vacancies")
    .insert({
      reference: ref("VAC"),
      client_name: client,
      client_email: text(form, "client_email", 200).toLowerCase() || null,
      title,
      description: text(form, "description", 4000) || null,
      location: text(form, "location", 160) || null,
      headcount,
      employment_type: (EMPLOYMENT_TYPES as readonly string[]).includes(type) ? type : "temporary",
      start_date: /^\d{4}-\d{2}-\d{2}$/.test(startRaw) ? startRaw : null,
    })
    .select("id")
    .single();
  await audit(staff, "vacancy.create", "vacancy", data?.id ?? null, { client, title, headcount });
  revalidatePath("/dashboard/admin/business/recruitment/vacancies");
}

export async function setVacancyStatus(id: string, status: string) {
  if (!(VACANCY_STATUSES as readonly string[]).includes(status)) return;
  const staff = await requireStaff(["recruiter"]);
  await staff.supabase.from("vacancies").update({ status }).eq("id", id);
  await audit(staff, "vacancy.status", "vacancy", id, { status });
  revalidatePath("/dashboard/admin/business/recruitment/vacancies");
  revalidatePath(`/dashboard/admin/business/recruitment/vacancies/${id}`);
}

/** Adds every ticked candidate to a vacancy in one go. */
export async function bulkAddToVacancy(form: FormData) {
  const staff = await requireStaff(["recruiter"]);
  const vacancyId = text(form, "vacancy_id", 40);
  const talent = ids(form, "talent");
  if (!vacancyId || talent.length === 0) return;
  await staff.supabase
    .from("vacancy_candidates")
    .upsert(talent.map((talent_id) => ({ vacancy_id: vacancyId, talent_id })), { onConflict: "vacancy_id,talent_id", ignoreDuplicates: true });
  await audit(staff, "pipeline.bulk_add", "vacancy", vacancyId, { count: talent.length });
  revalidatePath("/dashboard/admin/business/recruitment");
  revalidatePath(`/dashboard/admin/business/recruitment/vacancies/${vacancyId}`);
}

/** Moves every ticked candidate to a stage (shortlist, interview, reject...). */
export async function bulkSetStage(form: FormData) {
  const staff = await requireStaff(["recruiter"]);
  const vacancyId = text(form, "vacancy_id", 40);
  const stage = text(form, "stage", 20);
  const rows = ids(form, "rows");
  if (!(STAGES as readonly string[]).includes(stage) || rows.length === 0) return;
  await staff.supabase
    .from("vacancy_candidates")
    .update({ stage, updated_at: new Date().toISOString() })
    .in("id", rows)
    .eq("vacancy_id", vacancyId);
  await audit(staff, "pipeline.bulk_stage", "vacancy", vacancyId, { stage, count: rows.length });
  revalidatePath(`/dashboard/admin/business/recruitment/vacancies/${vacancyId}`);
}

// --- Bulk messages ---------------------------------------------------------------

/**
 * Emails the ticked candidates. Only people whose consent is recorded as given are contacted;
 * everyone else is skipped. Each message carries a one-click opt-out link.
 */
export async function bulkEmailTalent(form: FormData) {
  const staff = await requireStaff(["recruiter"]);
  let talent = ids(form, "talent");
  // From a vacancy's pipeline the ticked boxes are pipeline entries; look up the people behind them.
  const pipelineRows = ids(form, "rows");
  if (pipelineRows.length > 0) {
    const { data: found } = await staff.supabase.from("vacancy_candidates").select("talent_id").in("id", pipelineRows);
    talent = (found ?? []).map((r: { talent_id: string }) => r.talent_id);
  }
  const subject = text(form, "subject", 200);
  const body = text(form, "message", 4000);
  const includeBooking = form.get("include_booking") === "on";
  const back = text(form, "back", 300) || "/dashboard/admin/business/recruitment";
  const safeBack = back.startsWith("/dashboard/admin/business/recruitment") ? back : "/dashboard/admin/business/recruitment";
  if (talent.length === 0 || !subject || !body) redirect(`${safeBack}${safeBack.includes("?") ? "&" : "?"}msg=${encodeURIComponent("Choose candidates and write a subject and message.")}`);
  if (talent.length > MAX_BULK_EMAIL) {
    redirect(`${safeBack}${safeBack.includes("?") ? "&" : "?"}msg=${encodeURIComponent(`Send to ${MAX_BULK_EMAIL} people or fewer at a time.`)}`);
  }

  const { data } = await staff.supabase
    .from("talent_pool")
    .select("id, full_name, email, consent_status, unsub_token")
    .in("id", talent);
  const eligible = (data ?? []).filter((t: { email: string | null; consent_status: string }) => t.email && t.consent_status === "given");
  let sent = 0;
  for (const t of eligible as { full_name: string; email: string; unsub_token: string }[]) {
    const first = t.full_name.split(" ")[0] || "there";
    const booking = includeBooking
      ? `<p><a href="${SITE_URL}/book?type=screening-call" style="display:inline-block;background:#12264d;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Book a time to speak to us</a></p>`
      : "";
    const ok = await sendEmail({
      to: t.email,
      replyTo: TEAM_EMAIL,
      subject,
      html: `<p>Hi ${esc(first)},</p>${esc(body).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}${booking}<p>The Resume Document Hub</p><p style="font-size:12px;color:#64748b">You are receiving this because you shared your CV with us. <a href="${SITE_URL}/api/talent/unsubscribe?t=${t.unsub_token}">Stop receiving messages</a>.</p>`,
    });
    if (ok) sent += 1;
  }
  const skipped = talent.length - eligible.length;
  await audit(staff, "talent.bulk_email", "talent_pool", null, { selected: talent.length, sent, skipped_no_consent_or_email: skipped, subject });
  redirect(`${safeBack}${safeBack.includes("?") ? "&" : "?"}msg=${encodeURIComponent(`Sent ${sent} message${sent === 1 ? "" : "s"}.${skipped ? ` ${skipped} skipped (no consent recorded or no email).` : ""}`)}`);
}

// --- Placements and timesheets ---------------------------------------------------

export async function createPlacement(form: FormData) {
  const staff = await requireStaff(["recruiter", "payroll"]);
  const talentId = text(form, "talent_id", 40);
  const client = text(form, "client_name", 160);
  const role = text(form, "role_title", 200);
  const start = text(form, "start_date", 10);
  const basis = text(form, "pay_basis", 10);
  const pay = Number(text(form, "pay_rate", 12));
  const bill = Number(text(form, "bill_rate", 12));
  if (!talentId || !client || !role || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !["hourly", "daily", "monthly"].includes(basis)) return;
  if (!Number.isFinite(pay) || !Number.isFinite(bill) || pay < 0 || bill < 0) return;
  const endRaw = text(form, "end_date", 10);
  const vacancyId = text(form, "vacancy_id", 40);
  const { data } = await staff.supabase
    .from("placements")
    .insert({
      talent_id: talentId,
      vacancy_id: vacancyId || null,
      client_name: client,
      role_title: role,
      start_date: start,
      end_date: /^\d{4}-\d{2}-\d{2}$/.test(endRaw) ? endRaw : null,
      pay_basis: basis,
      pay_rate: pay,
      bill_rate: bill,
    })
    .select("id")
    .single();
  if (vacancyId) {
    await staff.supabase
      .from("vacancy_candidates")
      .update({ stage: "placed", updated_at: new Date().toISOString() })
      .eq("vacancy_id", vacancyId)
      .eq("talent_id", talentId);
  }
  await audit(staff, "placement.create", "placement", data?.id ?? null, { client, role });
  revalidatePath("/dashboard/admin/business/recruitment/placements");
}

export async function addTimesheet(form: FormData) {
  const staff = await requireStaff(["recruiter", "payroll"]);
  const placementId = text(form, "placement_id", 40);
  const week = text(form, "week_ending", 10);
  const units = Number(text(form, "units", 8));
  if (!placementId || !/^\d{4}-\d{2}-\d{2}$/.test(week) || !Number.isFinite(units) || units < 0) return;
  await staff.supabase
    .from("placement_timesheets")
    .upsert({ placement_id: placementId, week_ending: week, units }, { onConflict: "placement_id,week_ending" });
  await audit(staff, "timesheet.save", "placement", placementId, { week, units });
  revalidatePath("/dashboard/admin/business/recruitment/placements");
}

export async function approveTimesheet(id: string) {
  const staff = await requireStaff(["recruiter", "payroll"]);
  await staff.supabase.from("placement_timesheets").update({ approved: true }).eq("id", id);
  await audit(staff, "timesheet.approve", "placement_timesheet", id);
  revalidatePath("/dashboard/admin/business/recruitment/placements");
}

export async function endPlacement(id: string) {
  const staff = await requireStaff(["recruiter", "payroll"]);
  await staff.supabase.from("placements").update({ status: "ended", end_date: new Date().toISOString().slice(0, 10) }).eq("id", id);
  await audit(staff, "placement.end", "placement", id);
  revalidatePath("/dashboard/admin/business/recruitment/placements");
}
