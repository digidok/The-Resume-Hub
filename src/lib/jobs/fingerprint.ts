/**
 * A normalized "same posting" key for a job listing, independent of its
 * application_url. Aggregators (Adzuna, SerpApi) and even the same
 * aggregator re-crawling a listing often hand back a different redirect/
 * tracking URL for what is otherwise the identical role — application_url
 * alone lets those through as duplicates. Deliberately coarse (title +
 * company + location, normalized) rather than a full-content hash: two
 * postings with the same title/company/location are the same opening for
 * a candidate's purposes even if wording differs slightly between sources.
 */
export function jobFingerprint(title: string, company: string, location: string | null): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return [normalize(title), normalize(company), normalize(location ?? "")].join("|");
}
