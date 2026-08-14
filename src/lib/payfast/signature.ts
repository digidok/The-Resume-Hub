/**
 * Payfast signature generation, matching the official Payfast/payfast-php-sdk
 * algorithm exactly (field order, PHP-style urlencode, passphrase placement).
 *
 * Checkout signature: only these fields, in this exact order, non-empty
 * values only. `passphrase` sits at its natural position in this list (NOT
 * appended at the end — that's a common but incorrect simplification).
 */
export const CHECKOUT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "notify_method",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "currency",
  "payment_method",
  "subscription_type",
  "passphrase",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

/**
 * PHP's urlencode(): spaces become '+', percent-encoding uses uppercase hex.
 * encodeURIComponent's RFC 3986 unreserved set (A-Za-z0-9-_.!~*'()) is wider
 * than PHP's (A-Za-z0-9-_. only) — the six extra characters PHP still
 * percent-encodes are re-escaped here so the two implementations agree
 * byte-for-byte on every input, not just the common case.
 */
export function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

async function md5Hex(input: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("md5").update(input, "utf8").digest("hex");
}

export async function buildCheckoutSignature(
  fields: Partial<Record<(typeof CHECKOUT_FIELD_ORDER)[number], string>>
): Promise<string> {
  const parts: string[] = [];
  for (const key of CHECKOUT_FIELD_ORDER) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${key}=${phpUrlEncode(String(value).trim())}`);
    }
  }
  return md5Hex(parts.join("&"));
}

/**
 * ITN signature verification. Unlike the checkout direction, this preserves
 * the *received* field order (Payfast controls it) and stops at the
 * `signature` key rather than skipping it, matching dataToString() in the
 * official SDK.
 */
export async function verifyItnSignature(
  orderedEntries: [string, string][],
  passphrase: string,
  receivedSignature: string
): Promise<{ valid: boolean; paramString: string }> {
  const parts: string[] = [];
  for (const [key, value] of orderedEntries) {
    if (key === "signature") break;
    parts.push(`${key}=${phpUrlEncode(value)}`);
  }
  const paramString = parts.join("&");
  const toHash = passphrase ? `${paramString}&passphrase=${phpUrlEncode(passphrase)}` : paramString;
  const signature = await md5Hex(toHash);
  return { valid: signature === receivedSignature, paramString };
}
