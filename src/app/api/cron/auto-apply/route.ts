import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAutoApplyMatches } from "@/lib/autoapply/match";
import { sendAutoApplyEmail } from "@/lib/notifications/email";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: settings, error: settingsError } = await supabase
    .from("auto_apply_settings")
    .select("*")
    .eq("enabled", true);

  if (settingsError) {
    console.error("Scheduled auto-apply: could not load settings", settingsError.message);
    return NextResponse.json({ error: "Scheduled run failed." }, { status: 500 });
  }

  let candidatesMatched = 0;

  for (const setting of settings ?? []) {
    const { jobs: matches } = await findAutoApplyMatches(
      supabase,
      setting.user_id,
      setting.keywords,
      setting.location ?? ""
    );

    await supabase
      .from("auto_apply_settings")
      .update({ last_run_at: new Date().toISOString() })
      .eq("user_id", setting.user_id);

    if (matches.length === 0) continue;

    const rows = matches.map((job) => ({
      job_id: job.id,
      candidate_id: setting.user_id,
      resume_id: setting.resume_id,
      cover_note: "Submitted automatically by Resume Hub Auto-Apply based on your saved keywords.",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .upsert(rows, { onConflict: "job_id,candidate_id", ignoreDuplicates: true })
      .select("id");

    if (insertError) {
      console.error("Scheduled auto-apply: insert failed", insertError.message, {
        userId: setting.user_id,
      });
      continue;
    }

    const appliedCount = inserted?.length ?? 0;
    if (appliedCount === 0) continue;

    candidatesMatched += 1;

    await supabase.from("notifications").insert({
      user_id: setting.user_id,
      type: "auto_apply",
      title: "Auto-apply found new matches",
      body: `Resume Hub auto-applied to ${appliedCount} new job${appliedCount === 1 ? "" : "s"} for you.`,
    });

    const { data: userData } = await supabase.auth.admin.getUserById(setting.user_id);
    if (userData.user?.email) {
      await sendAutoApplyEmail(userData.user.email, appliedCount);
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), candidatesMatched });
}
