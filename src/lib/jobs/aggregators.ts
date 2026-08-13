/**
 * Job boards/aggregators that Adzuna's redirect and Google Jobs' apply
 * options routinely point to instead of the employer's own site. Shared
 * between the SerpApi sync (matched against apply_option titles) and the
 * apply-channel classifier (matched against application_url hostnames) so
 * the two lists can't drift apart.
 */
export const KNOWN_AGGREGATOR_NAMES = [
  "adzuna",
  "indeed",
  "linkedin",
  "ziprecruiter",
  "glassdoor",
  "simplyhired",
  "monster",
  "careerjet",
  "jobted",
  "totaljobs",
  "reed",
  "careerbuilder",
  "snagajob",
  "talent.com",
  "jooble",
  "neuvoo",
  "pnet",
  "careers24",
  "jobmail",
  "gumtree",
  "careerjunction",
  "bestjobs",
  "jobvine",
  "jobjack",
  "google.com",
];
