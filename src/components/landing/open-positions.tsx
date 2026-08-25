import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplyChannelBadge } from "@/components/jobs/apply-channel-badge";
import { formatSalaryFull } from "@/lib/currency";
import { ScrollReveal, ScrollStagger } from "@/components/motion/scroll-reveal";
import { MotionCard } from "@/components/motion/motion-card";
import type { Job } from "@/types/database";

const HOMEPAGE_JOB_COUNT = 6;

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function daysAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function isRecentlyPosted(iso: string) {
  return Date.now() - new Date(iso).getTime() < 7 * 86400000;
}

/** Public homepage teaser of live listings — South African roles surfaced first,
 * then newest overall. Full detail is gated behind sign-up on the job page itself. */
export async function OpenPositions() {
  const supabase = await createClient();
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .order("posted_at", { ascending: false })
    .limit(40);

  const jobs = (jobsData ?? []) as Job[];
  if (jobs.length === 0) return null;

  const positions = [...jobs]
    .sort((a, b) => {
      const aSA = a.country === "South Africa" ? 0 : 1;
      const bSA = b.country === "South Africa" ? 0 : 1;
      if (aSA !== bSA) return aSA - bSA;
      return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
    })
    .slice(0, HOMEPAGE_JOB_COUNT);

  return (
    <section id="open-positions" className="mx-auto max-w-5xl px-4 pb-20 pt-24 sm:pt-28">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Open positions, right now.
        </h2>
        <p className="mt-2 text-slate-600">
          Verified roles from South Africa and beyond — updated daily.
        </p>
      </ScrollReveal>
      <ScrollStagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {positions.map((job) => (
          <MotionCard key={job.id}>
            <Link href={`/jobs/${job.id}`}>
              <Card className="p-5 transition hover:border-brand-300 hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-500">
                      {job.company} {job.location ? `· ${job.location}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <ApplyChannelBadge job={job} />
                      {job.country === "South Africa" && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          South Africa
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  {(job.salary_min || job.salary_max) && (
                    <span>{formatSalaryFull(job.salary_min, job.salary_max, job.currency)}</span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isRecentlyPosted(job.posted_at) ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    {daysAgo(job.posted_at)}
                  </span>
                </div>
              </Card>
            </Link>
          </MotionCard>
        ))}
      </ScrollStagger>
      <div className="mt-8 text-center">
        <Link href="/jobs">
          <Button variant="outline">
            View all open jobs
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
