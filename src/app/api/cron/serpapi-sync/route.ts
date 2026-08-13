import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSerpApiJobs } from "@/lib/serpapi/sync";
import { syncCompanyRatings } from "@/lib/serpapi/company-ratings";

// Runs both SerpApi-backed syncs back to back since they share the same
// API key and free-tier quota — keeping them in one cron trigger avoids
// juggling a separate schedule (and possible cron-job-count limits) for
// what's really one "SerpApi upkeep" concern.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  let jobs;
  try {
    jobs = await syncSerpApiJobs(supabase);
  } catch (err) {
    console.error("SerpApi jobs sync failed", err);
    jobs = { error: err instanceof Error ? err.message : "Sync failed." };
  }

  let companyRatings;
  try {
    companyRatings = await syncCompanyRatings(supabase);
  } catch (err) {
    console.error("SerpApi company ratings sync failed", err);
    companyRatings = { error: err instanceof Error ? err.message : "Sync failed." };
  }

  return NextResponse.json({ ok: true, jobs, companyRatings });
}
