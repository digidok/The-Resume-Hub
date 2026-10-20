import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findAutoApplyMatches,
  findExternalKitMatches,
} from "@/lib/autoapply/match";
import {
  sendAutoApplyEmail,
  sendPreparedKitsEmail,
} from "@/lib/notifications/email";
import { notifyCandidate } from "@/lib/notifications/dispatch";
import { prepareApplicationKit } from "@/lib/ai/application-kit";

// Each prepared kit is an AI call (~10-20s), so keep a run bounded.
export const maxDuration = 300;
const KITS_PER_CANDIDATE = 3;
const KITS_PER_RUN = 12;

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
    console.error(
      "Scheduled auto-apply: could not load settings",
      settingsError.message,
    );
    return NextResponse.json(
      { error: "Scheduled run failed." },
      { status: 500 },
    );
  }

  let candidatesMatched = 0;
  let kitsPrepared = 0;

  for (const setting of settings ?? []) {
    const { jobs: matches } = await findAutoApplyMatches(
      supabase,
      setting.user_id,
      setting.keywords,
      setting.location ?? "",
    );

    await supabase
      .from("auto_apply_settings")
      .update({ last_run_at: new Date().toISOString() })
      .eq("user_id", setting.user_id);

    nativeApply: {
      if (matches.length === 0) break nativeApply;

      const rows = matches.map((job) => ({
        job_id: job.id,
        candidate_id: setting.user_id,
        resume_id: setting.resume_id,
        cover_note:
          "Submitted automatically by Resume Hub Auto-Apply based on your saved keywords.",
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("applications")
        .upsert(rows, {
          onConflict: "job_id,candidate_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (insertError) {
        console.error(
          "Scheduled auto-apply: insert failed",
          insertError.message,
          {
            userId: setting.user_id,
          },
        );
        break nativeApply;
      }

      const appliedCount = inserted?.length ?? 0;
      if (appliedCount === 0) break nativeApply;

      candidatesMatched += 1;

      await notifyCandidate(supabase, {
        userId: setting.user_id,
        type: "auto_apply",
        title: "Auto-apply found new matches",
        body: `Resume Hub auto-applied to ${appliedCount} new job${appliedCount === 1 ? "" : "s"} for you.`,
      });

      const { data: userData } = await supabase.auth.admin.getUserById(
        setting.user_id,
      );
      if (userData.user?.email) {
        await sendAutoApplyEmail(userData.user.email, appliedCount);
      }
    }

    // Jobs on employers' own sites: prepare a tailored kit only. Nothing is
    // sent to an employer; the candidate reviews it and applies themselves.
    if (kitsPrepared >= KITS_PER_RUN) continue;
    const { jobs: externalMatches, careerProfile } =
      await findExternalKitMatches(
        supabase,
        setting.user_id,
        setting.keywords,
        setting.location ?? "",
        Math.min(KITS_PER_CANDIDATE, KITS_PER_RUN - kitsPrepared),
      );
    let preparedForUser = 0;
    for (const job of externalMatches) {
      const result = await prepareApplicationKit(supabase, {
        userId: setting.user_id,
        resumeId: setting.resume_id,
        job,
        careerProfile,
      });
      if (result.ok) preparedForUser += 1;
    }
    if (preparedForUser === 0) continue;
    kitsPrepared += preparedForUser;

    await notifyCandidate(supabase, {
      userId: setting.user_id,
      type: "auto_apply",
      title: "Application kits ready to review",
      body: `We prepared ${preparedForUser} tailored application kit${preparedForUser === 1 ? "" : "s"} for jobs on employers' sites. Nothing has been sent — review and apply yourself from your Applications page.`,
    });
    const { data: kitUser } = await supabase.auth.admin.getUserById(
      setting.user_id,
    );
    if (kitUser.user?.email) {
      await sendPreparedKitsEmail(kitUser.user.email, preparedForUser);
    }
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    candidatesMatched,
    kitsPrepared,
  });
}
