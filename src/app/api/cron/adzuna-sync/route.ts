import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAdzunaJobs } from "@/lib/adzuna/sync";

// 19 countries × up to 3 pages each — give this the longest duration
// Vercel's Hobby plan allows (Pro/Enterprise projects can raise this further).
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const result = await syncAdzunaJobs(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Adzuna sync failed", err);
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }
}
