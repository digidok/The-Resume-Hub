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
  /** When set, this package's ITN also sets subscription_plan + a 30-day
   * subscription_expires_at (same mechanism the recurring subscriptions use)
   * — but since checkout never sends a Payfast subscription_type, no
   * payfast_token comes back, so it reads as "Active until X — won't
   * renew" with no cancel button, matching a genuine one-time purchase. */
  subscriptionPlanTarget?: "candidate_pro" | "employer_jobs";
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", label: "Starter", amountZar: 49, credits: 25, grantsPro: false },
  { id: "growth", label: "Growth", amountZar: 149, credits: 100, grantsPro: true },
  { id: "power", label: "Power", amountZar: 349, credits: 300, grantsPro: true },
];

/**
 * A once-off alternative to the R99/month Candidate Pro subscription: the
 * same Pro access for 30 days, paid once instead of recurring. Kept out of
 * CREDIT_PACKAGES so it renders next to the monthly plan rather than in the
 * credit top-up grid.
 */
export const PRO_ONCE_OFF_PACKAGE: CreditPackage = {
  id: "pro_30day",
  label: "Pro — 30 Day Pass",
  amountZar: 150,
  credits: 0,
  grantsPro: true,
  subscriptionPlanTarget: "candidate_pro",
};

export type InterviewPackPackage = {
  id: "quick_prep" | "full_prep_pack" | "prep_and_mock";
  label: string;
  amountZar: number;
};

// Sold from the /interview-ready quiz funnel, not the subscription page —
// flat one-off purchases, no credits or Pro plan attached. Content
// fulfillment (the WhatsApp tip sequence / prep document) is handled
// outside this app once payment confirms — see the n8n webhook contract.
export const INTERVIEW_PACK_PACKAGES: InterviewPackPackage[] = [
  { id: "quick_prep", label: "Quick Prep", amountZar: 199 },
  { id: "full_prep_pack", label: "Full Prep Pack", amountZar: 399 },
  { id: "prep_and_mock", label: "Prep + Mock Interview", amountZar: 699 },
];

// Pricing for the WhatsApp-first done-for-you CV/LinkedIn service (Meta ad →
// WhatsApp → rep-assisted generation → admin approval → this checkout).
// Payment for these orders is generated and confirmed entirely outside this
// app's own Payfast integration (n8n owns that leg, same as the interview
// pack) — this map just gives the review-queue client-decision route a
// single source of truth for the amount to hand back to n8n.
export const WHATSAPP_ORDER_PRICING: Record<"cv_cover_letter" | "linkedin_revamp", number> = {
  cv_cover_letter: 150,
  linkedin_revamp: 599,
};

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
