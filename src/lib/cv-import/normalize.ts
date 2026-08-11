const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Safely repairs common OCR email artifacts (stray spaces around @ and .)
 * ONLY when the repaired string is a clean, unambiguous match. Otherwise the
 * original value is returned unchanged and flagged for the user to confirm.
 */
export function normalizeEmail(raw: string | undefined): { value: string; valid: boolean } {
  const value = (raw ?? "").trim();
  if (!value) return { value: "", valid: true };
  if (EMAIL_REGEX.test(value)) return { value, valid: true };

  const repaired = value.replace(/\s*@\s*/g, "@").replace(/\s+/g, "").replace(/,/g, ".");
  if (EMAIL_REGEX.test(repaired)) return { value: repaired, valid: true };

  return { value, valid: false };
}

// Matches +27..., 0[1-9]..., with optional spaces/dashes.
const SA_PHONE_REGEX = /(\+27|0)(\s|-)?[1-9](\s|-)?\d{2}(\s|-)?\d{3}(\s|-)?\d{4}\b/;

export function normalizePhone(
  raw: string | undefined,
  countryHint?: string | null
): { value: string; valid: boolean } {
  const value = (raw ?? "").trim();
  if (!value) return { value: "", valid: true };

  const digitsOnly = value.replace(/[^\d+]/g, "");

  const isLikelySA = !countryHint || /south africa/i.test(countryHint);
  if (isLikelySA) {
    const match = digitsOnly.match(/^(\+27|0)(\d{9})$/);
    if (match) {
      const national = match[2];
      const formatted = `${match[1] === "0" ? "0" : "+27"}${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
      return { value: formatted, valid: true };
    }
  }

  if (SA_PHONE_REGEX.test(value) || /^\+\d{7,15}$/.test(digitsOnly)) {
    return { value, valid: true };
  }

  return { value, valid: false };
}

/**
 * Finds a LinkedIn profile URL even when OCR breaks it across whitespace or
 * newlines (e.g. "linkedin.com / in / jane-doe").
 */
export function normalizeLinkedin(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";

  const collapsed = value.replace(/\s*\/\s*/g, "/").replace(/\s+/g, "");
  const match = collapsed.match(/linkedin\.com\/(in|pub)\/[a-zA-Z0-9-_%]+/i);
  if (!match) return value;

  return `https://www.${match[0].replace(/^https?:\/\/(www\.)?/i, "")}`;
}
