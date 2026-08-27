import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmploymentType } from "@/types/database";
import { extractSkillsFromText } from "@/lib/matching/skill-synonyms";
import { jobFingerprint } from "@/lib/jobs/fingerprint";

const ADZUNA_SOURCE = "Adzuna";
const RESULTS_PER_PAGE = 50;
const PAGES_TO_FETCH = 3;
/** Resume Hub's home market — always synced first, and pulled much deeper than the rest. */
const PRIMARY_COUNTRY_CODE = "za";
const PRIMARY_COUNTRY_PAGES = 10;
/**
 * How many of the other 18 countries get synced per run. Adzuna's free
 * plan caps out around 1,000 API calls/month (1 call per page fetched).
 * South Africa alone costs PRIMARY_COUNTRY_PAGES (10) calls/day (~300/mo).
 * Syncing all 18 remaining countries daily at PAGES_TO_FETCH each would add
 * up to 54 more calls/day (~1,620/mo) — comfortably over quota on its own.
 * Capping it to 6/day (~18 calls, ~540/mo) keeps South Africa + the rest
 * around 840 calls/month, under quota with room to spare, at the cost of
 * each non-primary country only getting synced roughly once every 3 days
 * instead of daily (see the block rotation below).
 */
const OTHER_COUNTRIES_PER_RUN = 6;
/** External listings this stale are assumed expired/filled — closed automatically. */
const STALE_AFTER_DAYS = 45;
/**
 * Soft cap on the whole run, well under Vercel's 60s hard limit (maxDuration
 * on the cron route). A hard timeout kills the function with no response at
 * all; this lets a long run finish the country it's on and return cleanly
 * with whatever it managed instead.
 */
const TIME_BUDGET_MS = 48_000;

/** Every country Adzuna's Jobs API covers — same app_id/app_key works across all of them. */
export const ADZUNA_COUNTRIES: { code: string; country: string; currency: string }[] = [
  { code: PRIMARY_COUNTRY_CODE, country: "South Africa", currency: "ZAR" },
  { code: "in", country: "India", currency: "INR" },
  { code: "sg", country: "Singapore", currency: "SGD" },
  { code: "gb", country: "United Kingdom", currency: "GBP" },
  { code: "us", country: "United States", currency: "USD" },
  { code: "au", country: "Australia", currency: "AUD" },
  { code: "ca", country: "Canada", currency: "CAD" },
  { code: "nz", country: "New Zealand", currency: "NZD" },
  { code: "de", country: "Germany", currency: "EUR" },
  { code: "fr", country: "France", currency: "EUR" },
  { code: "nl", country: "Netherlands", currency: "EUR" },
  { code: "it", country: "Italy", currency: "EUR" },
  { code: "es", country: "Spain", currency: "EUR" },
  { code: "at", country: "Austria", currency: "EUR" },
  { code: "be", country: "Belgium", currency: "EUR" },
  { code: "pl", country: "Poland", currency: "PLN" },
  { code: "br", country: "Brazil", currency: "BRL" },
  { code: "mx", country: "Mexico", currency: "MXN" },
  { code: "ch", country: "Switzerland", currency: "CHF" },
];

type AdzunaResult = {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  description?: string;
  redirect_url?: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  contract_time?: string;
  category?: { label?: string };
  created?: string;
};

function mapEmploymentType(result: AdzunaResult): EmploymentType {
  if (result.contract_type === "contract") return "contract";
  if (result.contract_time === "part_time") return "part_time";
  return "full_time";
}

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchAdzunaPage(
  appId: string,
  appKey: string,
  countryCode: string,
  page: number
): Promise<AdzunaResult[]> {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(RESULTS_PER_PAGE));
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Adzuna API (${countryCode}) returned ${res.status}`);
  }
  const data = await res.json();
  return (data.results ?? []) as AdzunaResult[];
}

export type AdzunaSyncResult = {
  fetched: number;
  created: number;
  closed: number;
  errors: string[];
  countriesProcessed: number;
  countriesTotal: number;
  truncated: boolean;
};

/**
 * Pulls current listings from every country Adzuna's Jobs API covers and
 * upserts them into the jobs table, deduped by application_url and by a
 * normalized title|company|location fingerprint (Adzuna's own id isn't a
 * column we store separately, and different aggregators/re-crawls often
 * hand back a different redirect URL for the same underlying posting).
 * Requires a service-role client — synced jobs have no employer_id (see
 * 20260812170059_nullable_job_employer.sql), and RLS would otherwise block
 * writes with no owning employer.
 *
 * Dedupe checks and inserts are batched per page (one query each, not one
 * per result) — a per-result round-trip would risk both the serverless
 * function's execution time limit and Adzuna's own call quota.
 *
 * South Africa is Resume Hub's home market: it's always synced first and
 * pulled PRIMARY_COUNTRY_PAGES deep. The other 18 countries are capped to
 * OTHER_COUNTRIES_PER_RUN per run (see its comment for the call-budget
 * math) via a block rotation that advances by a full block each day, so
 * every country gets synced roughly once every few days rather than all
 * 18 daily — deterministic and independent of how long any run takes,
 * with TIME_BUDGET_MS kept as a secondary safety net against Vercel's
 * hard timeout on a slow day.
 */
export async function syncAdzunaJobs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<AdzunaSyncResult> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID / ADZUNA_APP_KEY are not configured.");
  }

  const startedAt = Date.now();
  const primaryCountry = ADZUNA_COUNTRIES.find((c) => c.code === PRIMARY_COUNTRY_CODE)!;
  const restCountries = ADZUNA_COUNTRIES.filter((c) => c.code !== PRIMARY_COUNTRY_CODE);
  const cycleLength = Math.ceil(restCountries.length / OTHER_COUNTRIES_PER_RUN);
  const cycleIndex = Math.floor(startedAt / 86400000) % cycleLength;
  const blockStart = cycleIndex * OTHER_COUNTRIES_PER_RUN;
  const todaysRest = restCountries.slice(blockStart, blockStart + OTHER_COUNTRIES_PER_RUN);
  const orderedCountries = [primaryCountry, ...todaysRest];

  const errors: string[] = [];
  let fetched = 0;
  let created = 0;
  let countriesProcessed = 0;
  let truncated = false;

  for (const { code, country, currency } of orderedCountries) {
    const isPrimary = code === PRIMARY_COUNTRY_CODE;
    if (!isPrimary && Date.now() - startedAt > TIME_BUDGET_MS) {
      truncated = true;
      break;
    }
    countriesProcessed++;

    const pagesToFetch = isPrimary ? PRIMARY_COUNTRY_PAGES : PAGES_TO_FETCH;
    for (let page = 1; page <= pagesToFetch; page++) {
      let results: AdzunaResult[];
      try {
        results = await fetchAdzunaPage(appId, appKey, code, page);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Unknown fetch error (${code})`);
        break;
      }
      if (results.length === 0) break;
      fetched += results.length;

      const valid = results.filter((r) => r.redirect_url && r.title && r.company?.display_name);
      if (valid.length === 0) continue;

      const urls = valid.map((r) => r.redirect_url as string);
      const fingerprints = valid.map((r) =>
        jobFingerprint(r.title, r.company!.display_name ?? "", r.location?.display_name ?? null)
      );
      const [{ data: existingByUrl }, { data: existingByFingerprint }] = await Promise.all([
        supabase.from("jobs").select("application_url").in("application_url", urls),
        supabase
          .from("jobs")
          .select("dedupe_key")
          .eq("status", "open")
          .in("dedupe_key", fingerprints),
      ]);
      const existingUrls = new Set((existingByUrl ?? []).map((r) => r.application_url));
      const existingFingerprints = new Set(
        (existingByFingerprint ?? []).map((r) => r.dedupe_key)
      );
      const seenFingerprints = new Set<string>();

      const newRows = valid
        .map((result, i) => ({ result, fingerprint: fingerprints[i] }))
        .filter(({ result, fingerprint }) => {
          if (existingUrls.has(result.redirect_url)) return false;
          // Also guards against the same run inserting two near-duplicate
          // results from the same page (e.g. a listing crawled twice with
          // different tracking params on its redirect URL).
          if (existingFingerprints.has(fingerprint) || seenFingerprints.has(fingerprint)) {
            return false;
          }
          seenFingerprints.add(fingerprint);
          return true;
        })
        .map(({ result, fingerprint }) => {
          const description = result.description ? stripHtml(result.description) : "See full listing for details.";
          return {
            employer_id: null,
            title: result.title,
            company: result.company!.display_name,
            location: result.location?.display_name ?? null,
            country,
            currency,
            employment_type: mapEmploymentType(result),
            description,
            salary_min: result.salary_min ? Math.round(result.salary_min) : null,
            salary_max: result.salary_max ? Math.round(result.salary_max) : null,
            industry: result.category?.label ?? null,
            skills: extractSkillsFromText(result.title, description),
            application_url: result.redirect_url,
            dedupe_key: fingerprint,
            source: ADZUNA_SOURCE,
            posted_at: result.created ?? new Date().toISOString(),
            status: "open" as const,
          };
        });

      if (newRows.length > 0) {
        const { data: inserted, error } = await supabase.from("jobs").insert(newRows).select("id");
        if (error) {
          errors.push(`${code}: ${error.message}`);
        } else {
          created += inserted?.length ?? 0;
        }
      }
    }
  }

  const staleCutoff = new Date(Date.now() - STALE_AFTER_DAYS * 86400000).toISOString();
  const { data: closedRows } = await supabase
    .from("jobs")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("source", ADZUNA_SOURCE)
    .eq("status", "open")
    .lt("posted_at", staleCutoff)
    .select("id");

  return {
    fetched,
    created,
    closed: closedRows?.length ?? 0,
    errors,
    countriesProcessed,
    countriesTotal: orderedCountries.length,
    truncated,
  };
}
