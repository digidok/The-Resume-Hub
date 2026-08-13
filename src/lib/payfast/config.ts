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

export type SubscriptionPackage = {
  id: "candidate_pro" | "employer_jobs";
  label: string;
  amountZar: number;
  role: "candidate" | "employer";
  jobCredits: number;
  description: string;
};

// Payfast's recurring billing frequency options don't include an exact
// "every 30 days" cycle — the closest standard option is monthly, so that's
// what these subscribe to. Actual billing dates will follow calendar months
// (e.g. 28-31 days apart) rather than a strict 30-day interval.
export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: "candidate_pro",
    label: "Candidate Pro",
    amountZar: 99,
    role: "candidate",
    jobCredits: 0,
    description: "Recurring monthly billing, unlocks the Pro plan.",
  },
  {
    id: "employer_jobs",
    label: "Employer Job Package",
    amountZar: 2999,
    role: "employer",
    jobCredits: 5,
    description: "Recurring monthly billing, unlocks 5 job posts per cycle.",
  },
];
