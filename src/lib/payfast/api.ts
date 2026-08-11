import { phpUrlEncode } from "@/lib/payfast/signature";
import { getPayfastConfig } from "@/lib/payfast/config";

/**
 * Payfast's management API (distinct from the checkout/ITN flow) — used for
 * actions like cancelling a subscription. Always hits api.payfast.co.za;
 * sandbox mode is signalled via a `testing=true` query param, not a
 * different host. Auth is three headers (merchant-id, version, timestamp)
 * plus a signature header, verified against the official payfast-php-sdk
 * (lib/Request.php + lib/Auth.php::generateApiSignature).
 */
const API_BASE_URL = "https://api.payfast.co.za";
const API_VERSION = "v1";

async function md5Hex(input: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("md5").update(input, "utf8").digest("hex");
}

async function buildApiSignature(
  fields: Record<string, string>,
  passphrase: string
): Promise<string> {
  const withPassphrase = passphrase ? { ...fields, passphrase } : fields;
  const sortedKeys = Object.keys(withPassphrase).sort();
  const parts = sortedKeys
    .filter((key) => key !== "signature")
    .map((key) => `${key}=${phpUrlEncode(withPassphrase[key])}`);
  return md5Hex(parts.join("&"));
}

async function payfastApiRequest(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string
): Promise<{ ok: boolean; status: number; body: string }> {
  const config = getPayfastConfig();
  // Matches PHP's date("Y-m-d\TH:i:sO") — ISO 8601 with a non-colon offset
  // (e.g. +0000). Vercel serverless functions run in UTC.
  const timestamp = `${new Date().toISOString().slice(0, 19)}+0000`;

  const headers: Record<string, string> = {
    "merchant-id": config.merchantId,
    version: API_VERSION,
    timestamp,
  };

  const query: Record<string, string> = config.mode === "sandbox" ? { testing: "true" } : {};
  const signature = await buildApiSignature({ ...headers, ...query }, config.passphrase);
  headers.signature = signature;

  const queryString = new URLSearchParams(query).toString();
  const url = `${API_BASE_URL}/${path}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, { method, headers });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

export async function cancelPayfastSubscription(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await payfastApiRequest("PUT", `subscriptions/${token}/cancel`);
    if (!result.ok) {
      console.error("Payfast subscription cancel failed", { status: result.status, body: result.body });
      return { ok: false, error: `Payfast returned ${result.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("Payfast subscription cancel request failed", err);
    return { ok: false, error: "Could not reach Payfast." };
  }
}
