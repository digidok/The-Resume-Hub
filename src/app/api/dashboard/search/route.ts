import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  type: "job" | "application" | "saved_job";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ results: [] });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const like = `%${q}%`;

  const [{ data: jobs }, { data: applications }, { data: savedJobs }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, company, location")
      .eq("status", "open")
      .or(`title.ilike.${like},company.ilike.${like}`)
      .limit(5),
    supabase
      .from("applications")
      .select("id, status, jobs:job_id(title, company)")
      .eq("candidate_id", user.id)
      .limit(20),
    supabase
      .from("saved_jobs")
      .select("id, job_id, external_title, external_company, jobs:job_id(title, company)")
      .eq("user_id", user.id)
      .limit(20),
  ]);

  const results: SearchResult[] = [];

  for (const job of jobs ?? []) {
    results.push({
      type: "job",
      id: job.id,
      title: job.title,
      subtitle: [job.company, job.location].filter(Boolean).join(" · "),
      href: `/jobs/${job.id}`,
    });
  }

  const needle = q.toLowerCase();
  for (const app of applications ?? []) {
    const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
    if (!job) continue;
    if (!job.title.toLowerCase().includes(needle) && !job.company.toLowerCase().includes(needle)) continue;
    results.push({
      type: "application",
      id: app.id,
      title: job.title,
      subtitle: `${job.company} · ${app.status}`,
      href: `/dashboard/applications`,
    });
  }

  for (const saved of savedJobs ?? []) {
    const job = Array.isArray(saved.jobs) ? saved.jobs[0] : saved.jobs;
    const title = job?.title ?? saved.external_title;
    const company = job?.company ?? saved.external_company;
    if (!title) continue;
    if (!title.toLowerCase().includes(needle) && !(company ?? "").toLowerCase().includes(needle)) continue;
    results.push({
      type: "saved_job",
      id: saved.id,
      title,
      subtitle: company ? `${company} · Saved` : "Saved",
      href: saved.job_id ? `/jobs/${saved.job_id}` : "/dashboard/saved-jobs",
    });
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}
