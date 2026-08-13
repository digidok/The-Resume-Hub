import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { computeJobMatch } from "@/lib/matching/job-match";
import { formatSalaryFull } from "@/lib/currency";
import { ADZUNA_COUNTRIES } from "@/lib/adzuna/sync";
import { RegionJobCounts } from "@/components/jobs/region-job-counts";
import { ApplyChannelBadge } from "@/components/jobs/apply-channel-badge";
import type { CareerProfile, Job } from "@/types/database";

export const metadata = {
  title: "Find Jobs — Resume Hub",
  description: "Search open roles from employers on Resume Hub, with AI-powered match scoring against your Career Passport.",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function sinceIso(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

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

export default async function JobBoardPage({ searchParams }: PageProps<"/jobs">) {
  const params = await searchParams;
  const country = typeof params.country === "string" ? params.country : "";
  const keyword = typeof params.q === "string" ? params.q : "";
  const location = typeof params.location === "string" ? params.location : "";
  const province = typeof params.province === "string" ? params.province : "";
  const industry = typeof params.industry === "string" ? params.industry : "";
  const employmentType = typeof params.type === "string" ? params.type : "";
  const minExperience = typeof params.experience === "string" ? Number(params.experience) : null;
  const minSalary = typeof params.salary === "string" ? Number(params.salary) : null;
  const postedWithin = typeof params.posted === "string" ? params.posted : "";
  const sort = typeof params.sort === "string" ? params.sort : "best_match";

  const supabase = await createClient();

  let query = supabase.from("jobs").select("*").eq("status", "open");
  if (country) query = query.eq("country", country);
  if (keyword) query = query.or(`title.ilike.%${keyword}%,company.ilike.%${keyword}%`);
  if (location) query = query.ilike("location", `%${location}%`);
  if (province) query = query.ilike("province", `%${province}%`);
  if (industry) query = query.ilike("industry", `%${industry}%`);
  if (employmentType) query = query.eq("employment_type", employmentType);
  if (minExperience) query = query.gte("experience_max", minExperience);
  if (minSalary) query = query.gte("salary_max", minSalary);
  if (postedWithin) {
    query = query.gte("posted_at", sinceIso(Number(postedWithin)));
  }

  const { data: jobsData } = await query.order("posted_at", { ascending: false });
  const jobs = (jobsData ?? []) as Job[];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let careerProfile: CareerProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from("career_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    careerProfile = (data as CareerProfile) ?? null;
  }

  const jobsWithMatch = jobs.map((job) => ({
    job,
    match: careerProfile ? computeJobMatch(careerProfile, job) : null,
  }));

  if (sort === "best_match" && careerProfile) {
    jobsWithMatch.sort((a, b) => (b.match?.overallScore ?? 0) - (a.match?.overallScore ?? 0));
  } else if (sort === "salary") {
    jobsWithMatch.sort((a, b) => (b.job.salary_max ?? 0) - (a.job.salary_max ?? 0));
  }
  // "newest" (and best_match with no profile) already ordered by posted_at desc from the query.

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Find Jobs</h1>
      <p className="mb-6 text-slate-600">Open roles from employers on Resume Hub.</p>

      {user && !careerProfile && (
        <Card className="mb-6 border-brand-200 bg-brand-50 p-4 text-sm text-slate-700">
          <Link href="/dashboard/career-passport" className="font-medium text-brand-700 hover:underline">
            Complete your Career Passport
          </Link>{" "}
          to see a personalised match score on every job.
        </Card>
      )}

      <RegionJobCounts />

      <Card className="mb-6 p-4">
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <Label htmlFor="country">Region</Label>
            <Select id="country" name="country" defaultValue={country}>
              <option value="">All regions</option>
              {ADZUNA_COUNTRIES.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="q">Keyword</Label>
            <Input id="q" name="q" defaultValue={keyword} placeholder="Job title or company" />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={location} placeholder="City" />
          </div>
          <div>
            <Label htmlFor="province">Province</Label>
            <Input id="province" name="province" defaultValue={province} placeholder="e.g. Gauteng" />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" defaultValue={industry} placeholder="e.g. Mining" />
          </div>
          <div>
            <Label htmlFor="type">Employment type</Label>
            <Select id="type" name="type" defaultValue={employmentType}>
              <option value="">Any</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="experience">Min. years experience</Label>
            <Input id="experience" name="experience" type="number" min={0} defaultValue={minExperience ?? ""} />
          </div>
          <div>
            <Label htmlFor="salary">Min. salary</Label>
            <Input id="salary" name="salary" type="number" min={0} defaultValue={minSalary ?? ""} />
          </div>
          <div>
            <Label htmlFor="posted">Date posted</Label>
            <Select id="posted" name="posted" defaultValue={postedWithin}>
              <option value="">Any time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="sort">Sort by</Label>
            <Select id="sort" name="sort" defaultValue={sort}>
              <option value="best_match">Best Match</option>
              <option value="newest">Newest</option>
              <option value="salary">Salary</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      {jobsWithMatch.length === 0 && (
        <Card className="p-8 text-center text-slate-500">No jobs match your filters right now.</Card>
      )}

      <div className="space-y-4">
        {jobsWithMatch.map(({ job, match }) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="p-5 transition hover:border-brand-300 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    {match && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          match.overallScore >= 85
                            ? "bg-emerald-50 text-emerald-700"
                            : match.overallScore >= 60
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {match.overallScore}% Match
                      </span>
                    )}
                    <h2 className="font-semibold text-slate-900">{job.title}</h2>
                  </div>
                  <p className="text-sm text-slate-500">
                    {job.company} {job.location ? `· ${job.location}` : ""}
                  </p>
                  <div className="mt-1.5">
                    <ApplyChannelBadge job={job} />
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
        ))}
      </div>
    </div>
  );
}
