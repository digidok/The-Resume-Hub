import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmploymentType } from "@/types/database";

const ADZUNA_SOURCE = "Adzuna";
const RESULTS_PER_PAGE = 50;
const PAGES_TO_FETCH = 3;
/** External listings this stale are assumed expired/filled — closed automatically. */
const STALE_AFTER_DAYS = 45;

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

async function fetchAdzunaPage(appId: string, appKey: string, page: number): Promise<AdzunaResult[]> {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/za/search/${page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(RESULTS_PER_PAGE));
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Adzuna API returned ${res.status}`);
  }
  const data = await res.json();
  return (data.results ?? []) as AdzunaResult[];
}

export type AdzunaSyncResult = { fetched: number; created: number; closed: number; errors: string[] };

/**
 * Pulls current South Africa listings from Adzuna and upserts them into the
 * jobs table (deduped by application_url, since Adzuna's own id isn't a
 * column we store separately). Requires a service-role client — synced jobs
 * have no employer_id (see 20260812170059_nullable_job_employer.sql), and
 * RLS would otherwise block writes with no owning employer.
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

  for (let page = 1; page <= PAGES_TO_FETCH; page++) {
    let results: AdzunaResult[];
    try {
      results = await fetchAdzunaPage(appId, appKey, page);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown fetch error");
      break;
    }
    if (results.length === 0) break;
    fetched += results.length;

    for (const result of results) {
      if (!result.redirect_url || !result.title || !result.company?.display_name) continue;

      const { data: existing } = await supabase
        .from("jobs")
        .select("id")
        .eq("application_url", result.redirect_url)
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from("jobs").insert({
        employer_id: null,
        title: result.title,
        company: result.company.display_name,
        location: result.location?.display_name ?? null,
        employment_type: mapEmploymentType(result),
        description: result.description ? stripHtml(result.description) : "See full listing for details.",
        salary_min: result.salary_min ? Math.round(result.salary_min) : null,
        salary_max: result.salary_max ? Math.round(result.salary_max) : null,
        industry: result.category?.label ?? null,
        application_url: result.redirect_url,
        source: ADZUNA_SOURCE,
        posted_at: result.created ?? new Date().toISOString(),
        status: "open",
      });

      if (error) {
        errors.push(error.message);
      } else {
        created += 1;
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
