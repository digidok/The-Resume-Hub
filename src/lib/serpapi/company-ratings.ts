import type { SupabaseClient } from "@supabase/supabase-js";

const COUNTRY = "South Africa";
/** Shared SerpApi budget is tight (250 free searches/month across the whole
 * platform) — cap how many new/unseen companies get looked up per run. */
const DAILY_LOOKUP_BUDGET = 2;
/** Re-check a company's rating this often, whether found or not — ratings
 * don't change daily, and a "not found" result can shift once a business's
 * Google listing catches up. */
const REFRESH_AFTER_DAYS = 30;

type SerpApiLocalResult = {
  title?: string;
  rating?: number;
  reviews?: number;
};

async function fetchCompanyRating(apiKey: string, company: string): Promise<SerpApiLocalResult | null> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_local");
  url.searchParams.set("q", company);
  url.searchParams.set("location", COUNTRY);
  url.searchParams.set("google_domain", "google.co.za");
  url.searchParams.set("gl", "za");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SerpApi Local (${company}) returned ${res.status}`);
  }
  const data = await res.json();
  const results = (data.local_results ?? []) as SerpApiLocalResult[];
  return results[0] ?? null;
}

export type CompanyRatingsSyncResult = {
  checked: number;
  errors: string[];
};

/**
 * Backfills/refreshes Google ratings for companies currently hiring on
 * Resume Hub (South Africa only) — a lightweight trust signal shown next
 * to a job listing, similar to Glassdoor, without building a review system.
 * Rate-limited to DAILY_LOOKUP_BUDGET/run since SerpApi's quota is shared
 * with the jobs search sync and listing verification.
 */
export async function syncCompanyRatings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<CompanyRatingsSyncResult> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not configured.");
  }

  const { data: openJobs } = await supabase
    .from("jobs")
    .select("company")
    .eq("status", "open")
    .eq("country", COUNTRY);

  const companies = [...new Set((openJobs ?? []).map((j) => j.company).filter(Boolean))] as string[];
  if (companies.length === 0) return { checked: 0, errors: [] };

  const { data: existingRatings } = await supabase
    .from("company_ratings")
    .select("company, fetched_at")
    .eq("country", COUNTRY)
    .in("company", companies);

  const refreshCutoff = Date.now() - REFRESH_AFTER_DAYS * 86400000;
  const freshCompanies = new Set(
    (existingRatings ?? [])
      .filter((r) => new Date(r.fetched_at).getTime() > refreshCutoff)
      .map((r) => r.company)
  );

  const due = companies.filter((c) => !freshCompanies.has(c)).slice(0, DAILY_LOOKUP_BUDGET);

  const errors: string[] = [];
  let checked = 0;

  for (const company of due) {
    let result: SerpApiLocalResult | null;
    try {
      result = await fetchCompanyRating(apiKey, company);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Unknown fetch error (${company})`);
      continue;
    }
    checked++;

    await supabase.from("company_ratings").upsert(
      {
        company,
        country: COUNTRY,
        rating: result?.rating ?? null,
        reviews_count: result?.reviews ?? null,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "company,country" }
    );
  }

  return { checked, errors };
}
