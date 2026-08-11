import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAutoApplyEmail } from "@/lib/notifications/email";

type ScheduledResult = { user_id: string; email: string | null; applied: number };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("run_scheduled_auto_apply", { p_secret: secret });

  if (error) {
    console.error("Scheduled auto-apply failed", error.message);
    return NextResponse.json({ error: "Scheduled run failed." }, { status: 500 });
  }

  const results = (data?.results ?? []) as ScheduledResult[];

  await Promise.all(
    results
      .filter((r) => r.email && r.applied > 0)
      .map((r) => sendAutoApplyEmail(r.email as string, r.applied))
  );

  return NextResponse.json({ ok: true, ranAt: data?.ran_at, candidatesMatched: results.length });
}
