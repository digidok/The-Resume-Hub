export const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: "R",
  INR: "₹",
  SGD: "S$",
};

export function currencySymbol(currency: string | null | undefined) {
  return CURRENCY_SYMBOLS[currency ?? "ZAR"] ?? `${currency ?? "ZAR"} `;
}

/** Compact "R160K – R200K" style range, using the right symbol for the job's currency. */
export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null | undefined
) {
  if (!min && !max) return null;
  const symbol = currencySymbol(currency);
  const fmt = (n: number) => `${symbol}${Math.round(n / 1000)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

/** Full "R650,000 – R850,000" style, for detail pages that show exact figures. */
export function formatSalaryFull(
  min: number | null,
  max: number | null,
  currency: string | null | undefined
) {
  if (!min && !max) return null;
  const symbol = currencySymbol(currency);
  const parts: string[] = [];
  if (min) parts.push(`${symbol}${min.toLocaleString()}`);
  if (max) parts.push(`${symbol}${max.toLocaleString()}`);
  return parts.join(" – ");
}
