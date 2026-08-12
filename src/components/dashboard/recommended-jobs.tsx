import Link from "next/link";
import { ArrowRight, Bookmark, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toggleSavedJob } from "@/lib/savedjobs/actions";
import { applyToJob } from "@/lib/applications/actions";
import type { Job } from "@/types/database";

const AVATAR_COLORS = ["bg-brand-700", "bg-slate-800", "bg-brand-500", "bg-accent-600"];

function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `R${Math.round(n / 1000)}K`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

export type RecommendedJob = { job: Job; matchScore: number | null; saved: boolean };

export function RecommendedJobs({
  jobs,
  resumeId,
}: {
  jobs: RecommendedJob[];
  resumeId: string | null;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recommended for you</h2>
          <p className="text-xs text-slate-500">Based on your profile and preferences</p>
        </div>
        <Link href="/jobs" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
          Browse all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No open matches right now — check back soon, or{" "}
          <Link href="/jobs" className="font-medium text-brand-700 hover:underline">
            browse all jobs
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {jobs.map(({ job, matchScore, saved }) => {
            const salary = formatSalary(job.salary_min, job.salary_max);
            return (
              <div key={job.id} className="flex flex-col rounded-xl border border-slate-100 p-3.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(job.company)}`}
                  >
                    {job.company.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {job.title}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{job.company}</p>
                  </div>
                  {matchScore != null && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        matchScore >= 85
                          ? "bg-emerald-50 text-emerald-700"
                          : matchScore >= 60
                            ? "bg-brand-50 text-brand-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {matchScore}% match
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                  )}
                  {salary && <span>{salary}</span>}
                </div>

                {job.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">{daysAgo(job.posted_at)}</span>
                  <div className="flex items-center gap-1.5">
                    <form action={toggleSavedJob.bind(null, job.id, !saved)}>
                      <button
                        type="submit"
                        aria-label={saved ? "Unsave job" : "Save job"}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                          saved
                            ? "border-brand-200 bg-brand-50 text-brand-700"
                            : "border-slate-200 text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
                      </button>
                    </form>
                    {resumeId ? (
                      <form action={applyToJob.bind(null, undefined)}>
                        <input type="hidden" name="job_id" value={job.id} />
                        <input type="hidden" name="resume_id" value={resumeId} />
                        <Button type="submit" size="sm">
                          Apply
                        </Button>
                      </form>
                    ) : (
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm">Apply</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
