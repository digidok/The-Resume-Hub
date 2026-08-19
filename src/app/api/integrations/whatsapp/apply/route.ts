import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

/** Inbound "apply via WhatsApp" webhook, called by the n8n workflow that bridges
 * the WhatsApp Business API. n8n matches inbound messages against the deterministic
 * "APPLY <jobId>" pattern from whatsappApplyLink() and passes jobId straight through
 * (no NLU needed for that path); jobQuery is a best-effort fallback for free text
 * a chat-style flow might hand off instead ("apply to the marketing job at Acme").
 * Always returns 200 with a { reply } string for n8n to send straight back on
 * WhatsApp, even for "expected" failures (no account, already applied, etc.) — those
 * are conversational replies, not API errors. */
export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const phoneRaw = typeof body?.phone === "string" ? body.phone : "";
  const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
  const jobQuery = typeof body?.jobQuery === "string" ? body.jobQuery.trim() : "";

  if (!phoneRaw.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }
  if (!jobId && !jobQuery) {
    return NextResponse.json({ error: "jobId or jobQuery is required" }, { status: 400 });
  }

  const phone = normalizePhone(phoneRaw);
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("phone_number", phone)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({
      reply:
        "We don't have a Resume Hub account linked to this WhatsApp number yet. Sign up free at resumehub.co.za, add this number under Profile settings, then send APPLY again.",
    });
  }
  if (profile.role !== "candidate") {
    return NextResponse.json({ reply: "Applying via WhatsApp is available for candidate accounts." });
  }

  type JobRow = { id: string; title: string; company: string; application_url: string | null };
  let job: JobRow | null = null;

  if (jobId) {
    const { data } = await supabase
      .from("jobs")
      .select("id, title, company, application_url")
      .eq("id", jobId)
      .eq("status", "open")
      .maybeSingle();
    job = data;
  } else {
    // Strip characters that are special to ilike (%, _) and to PostgREST's
    // .or() filter syntax (,()) — jobQuery is free text from an inbound
    // WhatsApp message, so it must not be able to inject extra filter clauses.
    const escaped = jobQuery.replace(/[%_,()]/g, "").slice(0, 100);
    if (!escaped) {
      return NextResponse.json({ reply: "Couldn't tell which job you meant — try again with the job title." });
    }
    const { data: matches } = await supabase
      .from("jobs")
      .select("id, title, company, application_url")
      .eq("status", "open")
      .or(`title.ilike.%${escaped}%,company.ilike.%${escaped}%`)
      .limit(5);

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        reply: `Couldn't find an open job matching "${jobQuery}". Browse resumehub.co.za/jobs and tap "Apply via WhatsApp" on the listing you want.`,
      });
    }
    if (matches.length > 1) {
      const list = matches.map((m, i) => `${i + 1}. ${m.title} at ${m.company}`).join("\n");
      return NextResponse.json({
        reply: `Found a few matches — tap "Apply via WhatsApp" on the exact listing at resumehub.co.za/jobs so I apply to the right one:\n${list}`,
      });
    }
    job = matches[0];
  }

  if (!job) {
    return NextResponse.json({ reply: "That job listing wasn't found or is no longer open." });
  }
  if (job.application_url) {
    return NextResponse.json({
      reply: `"${job.title}" at ${job.company} accepts applications on its original site, not through Resume Hub — check the listing on resumehub.co.za for the link.`,
    });
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!resume) {
    return NextResponse.json({
      reply: "You don't have a CV built yet — sign in at resumehub.co.za, build one, then send APPLY again.",
    });
  }

  const { error: insertError } = await supabase.from("applications").insert({
    job_id: job.id,
    candidate_id: profile.id,
    resume_id: resume.id,
    cover_note: "Applied via WhatsApp",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ reply: `You've already applied to "${job.title}" at ${job.company}.` });
    }
    console.error("WhatsApp apply: insert failed", insertError);
    return NextResponse.json({ reply: "Something went wrong submitting that application — please try again shortly." });
  }

  // They're already engaging on this channel, so opt them into WhatsApp status
  // updates automatically — turning it off again is one tap in Profile settings.
  await supabase.from("profiles").update({ whatsapp_opt_in: true }).eq("id", profile.id);

  return NextResponse.json({
    reply: `Applied! Your CV is in for "${job.title}" at ${job.company}. We'll message you here with any updates — turn that off anytime in Profile settings on resumehub.co.za.`,
  });
}
