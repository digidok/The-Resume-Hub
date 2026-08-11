import { NextResponse } from "next/server";
import { promises as dns } from "dns";
import { createClient } from "@/lib/supabase/server";
import { getPayfastConfig, PAYFAST_VALID_HOSTS } from "@/lib/payfast/config";
import { verifyItnSignature } from "@/lib/payfast/signature";

async function resolvePayfastIps(): Promise<Set<string>> {
  const ips = new Set<string>();
  await Promise.all(
    PAYFAST_VALID_HOSTS.map(async (host) => {
      try {
        const addresses = await dns.resolve4(host);
        addresses.forEach((ip) => ips.add(ip));
      } catch {
        // Host lookup failed — skip, other hosts may still resolve.
      }
    })
  );
  return ips;
}

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

/**
 * Payfast ITN handler. Always returns 200 (so Payfast doesn't keep retrying)
 * — validation failures are logged server-side, not surfaced to the caller.
 * Credits/plan are granted only after all five checks pass: signature, source
 * IP, a server-to-server confirmation POST back to Payfast, payment_status
 * being COMPLETE, and (inside process_payfast_itn) an amount match.
 */
export async function POST(request: Request) {
  const config = getPayfastConfig();
  const rawBody = await request.text();

  const params = new URLSearchParams(rawBody);
  const orderedEntries: [string, string][] = Array.from(params.entries());
  const pfData = Object.fromEntries(orderedEntries);

  const receivedSignature = pfData.signature;
  if (!receivedSignature) {
    console.error("Payfast ITN: missing signature");
    return new NextResponse("OK");
  }

  const { valid: signatureValid, paramString } = await verifyItnSignature(
    orderedEntries,
    config.passphrase,
    receivedSignature
  );
  if (!signatureValid) {
    console.error("Payfast ITN: invalid signature", { mPaymentId: pfData.m_payment_id });
    return new NextResponse("OK");
  }

  if (pfData.merchant_id !== config.merchantId) {
    console.error("Payfast ITN: merchant_id mismatch", { got: pfData.merchant_id });
    return new NextResponse("OK");
  }

  const clientIp = getClientIp(request);
  const validIps = await resolvePayfastIps();
  if (!clientIp || !validIps.has(clientIp)) {
    console.error("Payfast ITN: source IP not recognized", { clientIp });
    return new NextResponse("OK");
  }

  let serverConfirmed = false;
  try {
    const confirmRes = await fetch(config.validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: paramString,
    });
    const confirmText = (await confirmRes.text()).trim();
    serverConfirmed = confirmText === "VALID";
  } catch (err) {
    console.error("Payfast ITN: server confirmation request failed", err);
  }
  if (!serverConfirmed) {
    console.error("Payfast ITN: server confirmation did not return VALID", {
      mPaymentId: pfData.m_payment_id,
    });
    return new NextResponse("OK");
  }

  const grossAmount = Number(pfData.amount_gross ?? pfData.amount);
  if (!pfData.m_payment_id || Number.isNaN(grossAmount)) {
    console.error("Payfast ITN: missing m_payment_id or unparseable amount");
    return new NextResponse("OK");
  }

  const supabase = await createClient();

  if (pfData.payment_status !== "COMPLETE") {
    console.error("Payfast ITN: payment_status is not COMPLETE, not fulfilling", {
      mPaymentId: pfData.m_payment_id,
      paymentStatus: pfData.payment_status,
    });
    await supabase.rpc("mark_payfast_payment_failed", { p_m_payment_id: pfData.m_payment_id });
    return new NextResponse("OK");
  }

  const { error } = await supabase.rpc("process_payfast_itn", {
    p_m_payment_id: pfData.m_payment_id,
    p_pf_payment_id: pfData.pf_payment_id ?? null,
    p_amount: grossAmount,
    p_token: pfData.token ?? null,
    p_item_name: pfData.item_name ?? null,
  });

  if (error) {
    console.error("Payfast ITN: process_payfast_itn RPC failed", error.message, {
      mPaymentId: pfData.m_payment_id,
    });
  }

  return new NextResponse("OK");
}
