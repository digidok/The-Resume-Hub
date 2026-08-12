import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmploymentType } from "@/types/database";

const ADZUNA_SOURCE = "Adzuna";
const RESULTS_PER_PAGE = 50;
const PAGES_TO_FETCH = 3;
/** External listings this stale are assumed expired/filled — closed automatically. */
const STALE_AFTER_DAYS = 45;

/** Every country Adzuna's Jobs API covers — same app_id/app_key works across all of them. */
export const ADZUNA_COUNTRIES: { code: string; country: string; currency: string }[] = [
  { code: "za", country: "South Africa", currency: "ZAR" },
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

export type AdzunaSyncResult = { fetched: number; created: number; closed: number; errors: string[] };

/**
 * Pulls current listings from every country Adzuna's Jobs API covers and
 * upserts them into the jobs table (deduped by application_url, since
 * Adzuna's own id isn't a column we store separately). Requires a
 * service-role client — synced jobs have no employer_id (see
 * 20260812170059_nullable_job_employer.sql), and RLS would otherwise block
 * writes with no owning employer.
 *
 * Dedupe checks and inserts are batched per page (one query each, not one
 * per result) — at 19 countries × 3 pages that's up to 57 pages of ~50
 * results each, and a per-result round-trip would risk the serverless
 * function's execution time limit.
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

  const errors: string[] = [];
  let fetched = 0;
  let created = 0;

  for (const { code, country, currency } of ADZUNA_COUNTRIES) {
    for (let page = 1; page <= PAGES_TO_FETCH; page++) {
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
      const { data: existingRows } = await supabase
        .from("jobs")
        .select("application_url")
        .in("application_url", urls);
      const existingUrls = new Set((existingRows ?? []).map((r) => r.application_url));

      const newRows = valid
        .filter((r) => !existingUrls.has(r.redirect_url))
        .map((result) => ({
          employer_id: null,
          title: result.title,
          company: result.company!.display_name,
          location: result.location?.display_name ?? null,
          country,
          currency,
          employment_type: mapEmploymentType(result),
          description: result.description ? stripHtml(result.description) : "See full listing for details.",
          salary_min: result.salary_min ? Math.round(result.salary_min) : null,
          salary_max: result.salary_max ? Math.round(result.salary_max) : null,
          industry: result.category?.label ?? null,
          application_url: result.redirect_url,
          source: ADZUNA_SOURCE,
          posted_at: result.created ?? new Date().toISOString(),
          status: "open" as const,
        }));

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

  return { fetched, created, closed: closedRows?.length ?? 0, errors };
}
