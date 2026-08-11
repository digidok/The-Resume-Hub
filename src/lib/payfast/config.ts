export const PAYFAST_VALID_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

export function getPayfastConfig() {
  const mode = process.env.PAYFAST_MODE === "live" ? "live" : "sandbox";
  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? "";
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY ?? "";
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
  const baseUrl = mode === "live" ? "https://www.payfast.co.za" : "https://sandbox.payfast.co.za";

  return {
    mode,
    merchantId,
    merchantKey,
    passphrase,
    baseUrl,
    processUrl: `${baseUrl}/eng/process`,
    validateUrl: `${baseUrl}/eng/query/validate`,
    configured: Boolean(merchantId && merchantKey),
  };
}

export type CreditPackage = {
  id: string;
  label: string;
  amountZar: number;
  credits: number;
  grantsPro: boolean;
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", label: "Starter", amountZar: 49, credits: 25, grantsPro: false },
  { id: "growth", label: "Growth", amountZar: 149, credits: 100, grantsPro: true },
  { id: "power", label: "Power", amountZar: 349, credits: 300, grantsPro: true },
];
