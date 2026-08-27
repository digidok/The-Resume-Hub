import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmploymentType } from "@/types/database";
import { KNOWN_AGGREGATOR_NAMES } from "@/lib/jobs/aggregators";
import { extractSkillsFromText } from "@/lib/matching/skill-synonyms";

const SERPAPI_SOURCE = "Google Jobs";
const COUNTRY = "South Africa";
const CURRENCY = "ZAR";
/** External listings this stale are assumed expired/filled — closed automatically. */
const STALE_AFTER_DAYS = 45;
/** How many near-stale listings get a real live-check via the Jobs Listing
 * API per run, instead of being closed blindly — see the budget note below. */
const LISTING_VERIFY_BUDGET = 2;

/**
 * A small, curated set of broad South African job-seeker search terms.
 * SerpApi's free plan is a single 250-searches/month pool shared across
 * this search sync, the company-ratings lookup, and stale-listing
 * verification — trimmed to 4 terms (~120/month at one run/day) to leave
 * room for the other two.
 */
const SEARCH_QUERIES = ["General worker", "Sales representative", "Administrator", "Software developer"];

type SerpApiApplyOption = { title?: string; link?: string };

type SerpApiJobResult = {
  job_id?: string;
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  via?: string;
  detected_extensions?: { schedule_type?: string };
  apply_options?: SerpApiApplyOption[];
};

function mapEmploymentType(result: SerpApiJobResult): EmploymentType {
  const schedule = result.detected_extensions?.schedule_type?.toLowerCase() ?? "";
  if (schedule.includes("contract")) return "contract";
  if (schedule.includes("part")) return "part_time";
  if (schedule.includes("intern")) return "internship";
  return "full_time";
}

/** Prefers an apply link that isn't a known aggregator/job-board — the closest
 * signal SerpApi gives us to "goes to the employer, not another agent". Falls
 * back to the first option Google returned if every option is a known board. */
function pickApplyUrl(options: SerpApiApplyOption[] | undefined): string | null {
  if (!options || options.length === 0) return null;
  const direct = options.find((opt) => {
    const title = opt.title?.toLowerCase() ?? "";
    return opt.link && !KNOWN_AGGREGATOR_NAMES.some((name) => title.includes(name));
  });
  return direct?.link ?? options[0]?.link ?? null;
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function fetchSerpApiJobs(apiKey: string, query: string): Promise<SerpApiJobResult[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_jobs");
  url.searchParams.set("q", query);
  url.searchParams.set("location", COUNTRY);
  url.searchParams.set("google_domain", "google.co.za");
  url.searchParams.set("gl", "za");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SerpApi (${query}) returned ${res.status}`);
  }
  const data = await res.json();
  return (data.jobs_results ?? []) as SerpApiJobResult[];
}

/** Re-checks a specific Google Jobs listing via the Jobs Listing API
 * (engine=google_jobs_listing) rather than assuming it's gone just because
 * our search sync hasn't re-surfaced it recently. */
async function isListingStillLive(apiKey: string, jobId: string): Promise<boolean> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_jobs_listing");
  url.searchParams.set("q", jobId);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return false;
  const data = (await res.json()) as { title?: string; error?: string };
  return Boolean(data.title) && !data.error;
}

export type SerpApiSyncResult = {
  fetched: number;
  created: number;
  closed: number;
  errors: string[];
  queriesProcessed: number;
};

/**
 * Pulls South Africa job listings from Google Jobs (via SerpApi) for a
 * small curated set of search terms and upserts them into the jobs table,
 * deduped by application_url — same pattern as the Adzuna sync. Requires a
 * service-role client, since these rows have no owning employer_id.
 */
export async function syncSerpApiJobs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<SerpApiSyncResult> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not configured.");
  }

  const errors: string[] = [];
  let fetched = 0;
  let created = 0;
  let queriesProcessed = 0;

  for (const query of SEARCH_QUERIES) {
    queriesProcessed++;
    let results: SerpApiJobResult[];
    try {
      results = await fetchSerpApiJobs(apiKey, query);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Unknown fetch error (${query})`);
      continue;
    }
    if (results.length === 0) continue;
    fetched += results.length;

    const valid = results
      .map((r) => ({ ...r, applyUrl: pickApplyUrl(r.apply_options) }))
      .filter((r) => r.applyUrl && r.title && r.company_name);
    if (valid.length === 0) continue;

    const urls = valid.map((r) => r.applyUrl as string);
    const { data: existingRows } = await supabase
      .from("jobs")
      .select("application_url")
      .in("application_url", urls);
    const existingUrls = new Set((existingRows ?? []).map((r) => r.application_url));

    const newRows = valid
      .filter((r) => !existingUrls.has(r.applyUrl))
      .map((result) => {
        const description = result.description
          ? cleanText(result.description)
          : "See full listing for details.";
        return {
          employer_id: null,
          title: result.title,
          company: result.company_name,
          location: result.location ?? null,
          country: COUNTRY,
          currency: CURRENCY,
          employment_type: mapEmploymentType(result),
          description,
          salary_min: null,
          salary_max: null,
          industry: null,
          skills: extractSkillsFromText(result.title ?? "", description),
          application_url: result.applyUrl,
          source: SERPAPI_SOURCE,
          serpapi_job_id: result.job_id ?? null,
          posted_at: new Date().toISOString(),
          status: "open" as const,
        };
      });

    if (newRows.length > 0) {
      const { data: inserted, error } = await supabase.from("jobs").insert(newRows).select("id");
      if (error) {
        errors.push(`${query}: ${error.message}`);
      } else {
        created += inserted?.length ?? 0;
      }
    }
  }

  const staleCutoff = new Date(Date.now() - STALE_AFTER_DAYS * 86400000).toISOString();
  let closed = 0;

  // Listings with a known Google job_id get a real live-check via the Jobs
  // Listing API before being closed — still live gets its clock reset
  // instead of getting re-checked (and re-spending budget) every run.
  const { data: nearStale } = await supabase
    .from("jobs")
    .select("id, serpapi_job_id")
    .eq("source", SERPAPI_SOURCE)
    .eq("status", "open")
    .not("serpapi_job_id", "is", null)
    .lt("posted_at", staleCutoff)
    .limit(LISTING_VERIFY_BUDGET);

  for (const row of nearStale ?? []) {
    try {
      const stillLive = await isListingStillLive(apiKey, row.serpapi_job_id as string);
      if (stillLive) {
        await supabase.from("jobs").update({ posted_at: new Date().toISOString() }).eq("id", row.id);
      } else {
        await supabase
          .from("jobs")
          .update({ status: "closed", updated_at: new Date().toISOString() })
          .eq("id", row.id);
        closed++;
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Listing check failed (${row.id})`);
    }
  }

  // Fallback for rows with no job_id to verify (shouldn't happen going
  // forward, but covers any that predate the serpapi_job_id column) —
  // closed blindly on the same timer as before.
  const { data: closedRows } = await supabase
    .from("jobs")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("source", SERPAPI_SOURCE)
    .eq("status", "open")
    .is("serpapi_job_id", null)
    .lt("posted_at", staleCutoff)
    .select("id");
  closed += closedRows?.length ?? 0;

  return {
    fetched,
    created,
    closed,
    errors,
    queriesProcessed,
  };
}
