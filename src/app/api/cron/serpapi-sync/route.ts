import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSerpApiJobs } from "@/lib/serpapi/sync";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const result = await syncSerpApiJobs(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("SerpApi sync failed", err);
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }
}
