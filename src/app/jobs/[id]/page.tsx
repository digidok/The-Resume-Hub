import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplyForm } from "@/components/jobs/apply-form";
import { ExternalApplyLink } from "@/components/jobs/external-apply-link";
import { QualificationCheck } from "@/components/jobs/qualification-check";
import { toggleSavedJob } from "@/lib/savedjobs/actions";
import { computeJobMatch } from "@/lib/matching/job-match";
import { formatSalaryFull } from "@/lib/currency";
import type { CareerProfile, Job } from "@/types/database";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function daysAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

function isRecentlyPosted(iso: string) {
  return Date.now() - new Date(iso).getTime() < 7 * 86400000;
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("title, company, location, description")
    .eq("id", id)
    .single();

  if (!job) return { title: "Job not found — Resume Hub" };

  return {
    title: `${job.title} at ${job.company} — Resume Hub`,
    description: job.description
      ? job.description.slice(0, 155)
      : `${job.title} at ${job.company}${job.location ? ` in ${job.location}` : ""}. Apply on Resume Hub.`,
  };
}

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let resumes: { id: string; title: string }[] = [];
  let alreadyApplied = false;
  let isEmployer = false;
  let isSaved = false;
  let careerProfile: CareerProfile | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isEmployer = profile?.role === "employer";

    if (!isEmployer) {
      const { data: myResumes } = await supabase
        .from("resumes")
        .select("id, title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      resumes = myResumes ?? [];

      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", id)
        .eq("candidate_id", user.id)
        .maybeSingle();
      alreadyApplied = Boolean(existing);

      const { data: saved } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("job_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      isSaved = Boolean(saved);

      const { data: careerProfileData } = await supabase
        .from("career_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      careerProfile = (careerProfileData as CareerProfile) ?? null;
    }
  }

  const match = careerProfile ? computeJobMatch(careerProfile, job as Job) : null;

  const EMPLOYMENT_TYPE_SCHEMA: Record<string, string> = {
    full_time: "FULL_TIME",
    part_time: "PART_TIME",
    contract: "CONTRACTOR",
    internship: "INTERN",
  };

  const COUNTRY_ISO: Record<string, string> = {
    "South Africa": "ZA",
    India: "IN",
    Singapore: "SG",
  };

  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.posted_at,
    employmentType: EMPLOYMENT_TYPE_SCHEMA[job.employment_type] ?? undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
            addressCountry: COUNTRY_ISO[job.country] ?? "ZA",
          },
        }
      : undefined,
    baseSalary:
      job.salary_min || job.salary_max
        ? {
            "@type": "MonetaryAmount",
            currency: job.currency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary_min ?? undefined,
              maxValue: job.salary_max ?? undefined,
              unitText: "YEAR",
            },
          }
        : undefined,
    validThrough: job.status !== "open" ? job.posted_at : undefined,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />
      <div className="flex items-center justify-between">
        <Link href="/jobs" className="text-sm text-brand-600 hover:underline">
          ← All jobs
        </Link>
        {user && !isEmployer && (
          <form action={toggleSavedJob.bind(null, job.id, !isSaved)}>
            <Button type="submit" size="sm" variant={isSaved ? "secondary" : "outline"}>
              {isSaved ? "★ Saved" : "☆ Save job"}
            </Button>
          </form>
        )}
      </div>
      <div className="mt-2 mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
        <p className="mt-1 text-slate-600">
          {job.company} {job.location ? `· ${job.location}` : ""} ·{" "}
          {EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
        </p>
        {(job.salary_min || job.salary_max) && (
          <p className="mt-1 text-sm text-slate-500">
            {formatSalaryFull(job.salary_min, job.salary_max, job.currency)}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isRecentlyPosted(job.posted_at) ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
          {daysAgo(job.posted_at)}
        </p>
        {job.status !== "open" && (
          <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            This role is no longer accepting applications.
          </p>
        )}
      </div>

      <Card className="mb-6 p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {job.description}
        </p>
      </Card>

      {job.hiring_manager_name && (
        <Card className="mb-6 border-0 border-l-[3px] border-brand-400 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hiring contact
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {job.hiring_manager_name}
            {job.hiring_manager_title ? (
              <span className="font-normal text-slate-500"> · {job.hiring_manager_title}</span>
            ) : null}
          </p>
          {job.hiring_manager_email && (
            <a
              href={`mailto:${job.hiring_manager_email}`}
              className="mt-1 inline-block text-sm text-brand-600 hover:underline"
            >
              {job.hiring_manager_email}
            </a>
          )}
        </Card>
      )}

      {match && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Your Match</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                match.overallScore >= 85
                  ? "bg-emerald-50 text-emerald-700"
                  : match.overallScore >= 60
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {match.overallScore}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Experience", match.experienceScore],
              ["Skills", match.skillsScore],
              ["Qualification", match.qualificationScore],
              ["Industry", match.industryScore],
              ["Location", match.locationScore],
            ].map(([label, score]) => (
              <div key={label as string} className="rounded-lg bg-slate-50 p-2 text-center">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-900">{score}%</p>
              </div>
            ))}
          </div>

          {match.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Why you match
              </p>
              <ul className="mt-1.5 space-y-1">
                {match.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {match.gaps.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                What you may be missing
              </p>
              <ul className="mt-1.5 space-y-1">
                {match.gaps.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-slate-700">
            {match.recommendation}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {user && !isEmployer && !job.application_url && (
              <Link href={`/dashboard/applications/kit/${job.id}`}>
                <Button type="button" size="sm">
                  Build Application Kit
                </Button>
              </Link>
            )}
            <Link href="/dashboard/resumes">
              <Button type="button" variant="outline" size="sm">
                Tailor My CV
              </Button>
            </Link>
            <QualificationCheck match={match} />
          </div>
        </Card>
      )}

      {user && !isEmployer && !careerProfile && (
        <Card className="mb-6 border-brand-200 bg-brand-50 p-4 text-sm text-slate-700">
          <Link href="/dashboard/career-passport" className="font-medium text-brand-700 hover:underline">
            Complete your Career Passport
          </Link>{" "}
          to see your match score for this role.
        </Card>
      )}

      {job.status === "open" && !isEmployer && (
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Apply for this role</h2>
            {user && !match && !job.application_url && (
              <Link href={`/dashboard/applications/kit/${job.id}`}>
                <Button type="button" variant="outline" size="sm">
                  Build Application Kit
                </Button>
              </Link>
            )}
          </div>
          {job.application_url ? (
            <ExternalApplyLink url={job.application_url} source={job.source} />
          ) : user ? (
            <ApplyForm jobId={job.id} resumes={resumes} alreadyApplied={alreadyApplied} />
          ) : (
            <p className="text-sm text-slate-600">
              <Link href={`/login?redirect=/jobs/${job.id}`} className="text-brand-600 hover:underline">
                Sign in
              </Link>{" "}
              to apply for this job.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
