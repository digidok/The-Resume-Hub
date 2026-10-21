"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/business/guard";

const PATH = "/dashboard/admin/business/tracker";

function text(form: FormData, key: string, max: number): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function num(form: FormData, key: string): number | null {
  const n = Number(form.get(key));
  return Number.isFinite(n) && n >= 0 && form.get(key) !== "" ? n : null;
}
function dateOrNull(form: FormData, key: string): string | null {
  const v = text(form, key, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

async function audit(
  { supabase, user }: Awaited<ReturnType<typeof requireAdminPage>>,
  action: string,
  entityId: string | null,
  meta: Record<string, unknown>
) {
  try {
    await supabase.from("audit_log").insert({ actor_id: user.id, actor_email: user.email ?? null, action, entity: "target", entity_id: entityId, meta });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}

export async function addTarget(form: FormData) {
  const admin = await requireAdminPage();
  const area = text(form, "area", 80);
  const measure = text(form, "measure", 160);
  const owner = text(form, "owner_name", 80);
  const target = num(form, "target");
  const unit = text(form, "unit", 10);
  const period = text(form, "period", 10);
  if (!area || !measure || !owner || target === null) return;
  if (!["count", "zar", "percent"].includes(unit) || !["week", "month"].includes(period)) return;
  const { data } = await admin.supabase
    .from("business_targets")
    .insert({ area, measure, owner_name: owner, target, unit, period })
    .select("id")
    .single();
  await audit(admin, "target.create", data?.id ?? null, { area, measure, target });
  revalidatePath(PATH);
}

export async function setTargetActive(id: string, active: boolean) {
  const admin = await requireAdminPage();
  const { error } = await admin.supabase.from("business_targets").update({ active }).eq("id", id);
  if (!error) await audit(admin, active ? "target.activate" : "target.retire", id, {});
  revalidatePath(PATH);
}

/** Changing a target only affects future results; past results keep the target they were judged against. */
export async function changeTarget(form: FormData) {
  const admin = await requireAdminPage();
  const id = text(form, "id", 40);
  const target = num(form, "target");
  if (!id || target === null) return;
  const { error } = await admin.supabase.from("business_targets").update({ target }).eq("id", id);
  if (!error) await audit(admin, "target.change", id, { target, reason: text(form, "reason", 300) });
  revalidatePath(PATH);
}

export async function recordResult(form: FormData) {
  const admin = await requireAdminPage();
  const targetId = text(form, "target_id", 40);
  const periodEnd = dateOrNull(form, "period_end");
  const actual = num(form, "actual");
  if (!targetId || !periodEnd || actual === null) return;
  const { data: t } = await admin.supabase.from("business_targets").select("target").eq("id", targetId).maybeSingle();
  if (!t) return;
  const { data, error } = await admin.supabase
    .from("business_target_results")
    .upsert(
      {
        target_id: targetId,
        period_end: periodEnd,
        actual,
        target_at_time: t.target,
        note: text(form, "note", 500) || null,
        recorded_by: admin.user.id,
      },
      { onConflict: "target_id,period_end" }
    )
    .select("id")
    .single();
  if (!error) await audit(admin, "target.result", data?.id ?? null, { targetId, periodEnd, actual });
  revalidatePath(PATH);
}

/** The miss report: what caused it, what changes, and the new date. */
export async function saveMissReport(form: FormData) {
  const admin = await requireAdminPage();
  const id = text(form, "result_id", 40);
  const cause = text(form, "miss_cause", 1000);
  const plan = text(form, "miss_plan", 1000);
  if (!id || !cause || !plan) return;
  const { error } = await admin.supabase
    .from("business_target_results")
    .update({ miss_cause: cause, miss_plan: plan, miss_new_date: dateOrNull(form, "miss_new_date") })
    .eq("id", id);
  if (!error) await audit(admin, "target.miss_report", id, {});
  revalidatePath(PATH);
}
