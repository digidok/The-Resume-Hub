import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeJobMatch } from "@/lib/matching/job-match";
import { sendWhatsAppMessage } from "@/lib/notifications/whatsapp";
import { AUTO_APPLY_MIN_SCORE } from "@/lib/autoapply/match";
import type { CareerProfile, Job } from "@/types/database";

const MAX_MATCHES_PER_MESSAGE = 3;

/** Phase 6 growth loop: a periodic WhatsApp digest of new strong job matches
 * for any candidate who's opted into WhatsApp, independent of whether
 * they've turned on auto-apply — this is a "here's what's out there" nudge,
 * not an action taken on their behalf. Reuses the same match-scoring and
 * WhatsApp-send machinery as auto-apply/the apply flow so scores mean the
 * same thing everywhere in the app. job_matches_sent dedupes so the same
 * job is never pushed to the same candidate twice across runs. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [{ data: candidates }, { data: openJobs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, phone_number")
      .eq("role", "candidate")
      .eq("whatsapp_opt_in", true)
      .not("phone_number", "is", null),
    supabase.from("jobs").select("*").eq("status", "open").order("posted_at", { ascending: false }).limit(300),
  ]);

  if (!candidates || candidates.length === 0 || !openJobs || openJobs.length === 0) {
    return NextResponse.json({ ok: true, candidatesNotified: 0 });
  }

  const jobs = openJobs as Job[];
  let candidatesNotified = 0;

  for (const candidate of candidates) {
    const [{ data: careerProfile }, { data: applications }, { data: alreadySent }] = await Promise.all([
      supabase.from("career_profiles").select("*").eq("user_id", candidate.id).maybeSingle(),
      supabase.from("applications").select("job_id").eq("candidate_id", candidate.id),
      supabase.from("job_matches_sent").select("job_id").eq("user_id", candidate.id),
    ]);

    if (!careerProfile) continue;

    const excludeIds = new Set([
      ...(applications ?? []).map((a: { job_id: string }) => a.job_id),
      ...(alreadySent ?? []).map((s: { job_id: string }) => s.job_id),
    ]);

    const matches = jobs
      .filter((job) => !excludeIds.has(job.id))
      .map((job) => ({ job, score: computeJobMatch(careerProfile as CareerProfile, job).overallScore }))
      .filter((m) => m.score >= AUTO_APPLY_MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_MATCHES_PER_MESSAGE);

    if (matches.length === 0) continue;

    const { error: insertError } = await supabase
      .from("job_matches_sent")
      .insert(matches.map((m) => ({ user_id: candidate.id, job_id: m.job.id })));
    if (insertError) {
      console.error("WhatsApp job broadcast: dedupe insert failed", insertError.message, { userId: candidate.id });
      continue;
    }

    const lines = matches.map(
      (m) => `• ${m.job.title} at ${m.job.company} (${m.score}% match) — resumehub.co.za/jobs/${m.job.id}`
    );
    const message = `🎯 New job matches for you on Resume Hub:\n${lines.join("\n")}`;

    await sendWhatsAppMessage(candidate.phone_number as string, message);
    candidatesNotified += 1;
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), candidatesNotified });
}
