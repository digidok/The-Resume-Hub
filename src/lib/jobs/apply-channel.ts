import { KNOWN_AGGREGATOR_NAMES } from "@/lib/jobs/aggregators";
import type { Job } from "@/types/database";

export type ApplyChannel = "direct" | "employer_site" | "external_agent";

/**
 * Classifies how a candidate ends up applying:
 * - "direct": posted natively by an employer account — applies in-app, no redirect at all.
 * - "employer_site": external listing (Adzuna/Google Jobs) whose application_url
 *   doesn't match a known job board — best-effort guess it's the employer's own site.
 * - "external_agent": external listing that redirects through a known aggregator
 *   (Adzuna's own click-tracking, Indeed, LinkedIn, etc).
 */
export function classifyApplyChannel(job: Pick<Job, "employer_id" | "application_url">): ApplyChannel {
  if (job.employer_id) return "direct";
  if (!job.application_url) return "external_agent";

  try {
    const host = new URL(job.application_url).hostname.toLowerCase();
    const isAggregator = KNOWN_AGGREGATOR_NAMES.some((name) => host.includes(name));
    return isAggregator ? "external_agent" : "employer_site";
  } catch {
    return "external_agent";
  }
}

export const APPLY_CHANNEL_META: Record<ApplyChannel, { label: string; className: string }> = {
  direct: { label: "Direct Apply", className: "bg-emerald-50 text-emerald-700" },
  employer_site: { label: "Employer's site", className: "bg-brand-50 text-brand-700" },
  external_agent: { label: "External listing", className: "bg-slate-100 text-slate-500" },
};
