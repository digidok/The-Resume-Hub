import Link from "next/link";
import { Check, MessageCircle, Minus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pricing — Resume Hub",
  description:
    "Simple, transparent pricing for candidates and employers on Resume Hub — free to start, pay only for the AI credits and job posts you need.",
};
import { Card } from "@/components/ui/card";
import { CREDIT_PACKAGES, SUBSCRIPTION_PACKAGES, PRO_ONCE_OFF_PACKAGE } from "@/lib/payfast/config";

const candidatePro = SUBSCRIPTION_PACKAGES.find((p) => p.role === "candidate")!;
const employerPlan = SUBSCRIPTION_PACKAGES.find((p) => p.role === "employer")!;

const CANDIDATE_FREE_FEATURES = [
  "20 AI credits to start",
  "Unlimited resume building & templates",
  "Apply to jobs, unlimited",
  "Save jobs & track applications",
  "Follow-up reminders",
];

const CANDIDATE_PRO_FEATURES = [
  "Everything in Free",
  "Unlimited AI credits — resume review, generation, mock interviews & more",
  "Pro status unlocked",
];

type FeatureCell = boolean | string;
type FeatureRow = { label: string; free: FeatureCell; pro: FeatureCell };

const CANDIDATE_FEATURE_TABLE: FeatureRow[] = [
  { label: "Resume builder with live preview", free: true, pro: true },
  { label: "9 curated templates (Classic, Minimal, Professional & more)", free: true, pro: true },
  { label: "Full library of 100+ templates, including Executive Portfolio", free: false, pro: true },
  { label: "AI credits", free: "20 to start", pro: "Unlimited" },
  { label: "AI resume review & ATS scoring", free: "Uses credits", pro: "Unlimited" },
  { label: "AI fill gaps, suggest duties & align to a job", free: "Uses credits", pro: "Unlimited" },
  { label: "Mock interview practice", free: "Uses credits", pro: "Unlimited" },
  { label: "Resume translation", free: "Uses credits", pro: "Unlimited" },
  { label: "Salary insights", free: "Uses credits", pro: "Unlimited" },
  { label: "Scheduled auto-apply", free: "Uses credits", pro: "Unlimited" },
  { label: "Print / download as PDF", free: false, pro: true },
  { label: "Public share link", free: "Watermarked", pro: "No watermark" },
  { label: "Apply to jobs", free: "Unlimited", pro: "Unlimited" },
  { label: "Save jobs & track applications", free: true, pro: true },
  { label: "Follow-up reminders", free: true, pro: true },
  { label: "Career Passport", free: true, pro: true },
];

function FeatureCellValue({ value }: { value: FeatureCell }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-brand-600" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-slate-300" />;
  return <span className="text-slate-700">{value}</span>;
}

const EMPLOYER_FREE_FEATURES = ["1 free job post", "Applicant tracking & scorecards", "Candidate pool access"];

const EMPLOYER_PAID_FEATURES = [
  "5 job posts per billing cycle",
  "Applicant tracking & scorecards",
  "Candidate pool access",
  "Interview scheduling & induction tools",
];

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple, honest pricing
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Start free. Upgrade only if you need more AI credits or more job posts.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-brand-600">
            For job seekers
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card className="p-6">
              <p className="font-semibold text-slate-900">Free</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">R0</p>
              <ul className="mt-5 space-y-2.5">
                {CANDIDATE_FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="mt-6 w-full">
                  Get started free
                </Button>
              </Link>
            </Card>

            <Card className="p-6">
              <p className="font-semibold text-slate-900">{PRO_ONCE_OFF_PACKAGE.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                R{PRO_ONCE_OFF_PACKAGE.amountZar}
                <span className="text-base font-medium text-slate-500"> once-off</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">No recurring billing — Pro for 30 days.</p>
              <ul className="mt-5 space-y-2.5">
                {CANDIDATE_PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="mt-6 w-full">
                  Get the 30-Day Pass
                </Button>
              </Link>
            </Card>

            <Card className="border-0 border-t-[3px] border-brand-500 p-6">
              <p className="font-semibold text-slate-900">{candidatePro.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                R{candidatePro.amountZar}
                <span className="text-base font-medium text-slate-500">/mo</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {CANDIDATE_PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="mt-6 w-full">Get Candidate Pro</Button>
              </Link>
              <p className="mt-3 text-center text-xs text-slate-400">
                Students get 50% off —{" "}
                <Link href="/student-discount" className="text-brand-600 hover:underline">
                  see student discount
                </Link>
              </p>
            </Card>
          </div>

          <h3 className="mt-14 text-center text-lg font-semibold text-slate-900">
            Free vs. Candidate Pro, feature by feature
          </h3>
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">Free</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-700">
                    {candidatePro.label}
                  </th>
                </tr>
              </thead>
              <tbody>
                {CANDIDATE_FEATURE_TABLE.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-700">{row.label}</td>
                    <td className="px-4 py-3 text-center">
                      <FeatureCellValue value={row.free} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FeatureCellValue value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-10 text-center text-sm font-semibold text-slate-500">
            Need more AI credits? One-time top-ups:
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card key={pkg.id} className="p-5 text-center">
                <p className="font-semibold text-slate-900">{pkg.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">R{pkg.amountZar}</p>
                <p className="mt-1 text-sm text-slate-500">{pkg.credits} AI credits</p>
                {pkg.grantsPro && (
                  <p className="mt-1 text-xs font-medium text-brand-600">
                    Includes Pro status (unlimited AI credits, no expiry)
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-accent-600">
              For employers
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card className="p-6">
                <p className="font-semibold text-slate-900">Free</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">R0</p>
                <ul className="mt-5 space-y-2.5">
                  {EMPLOYER_FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="mt-6 w-full">
                    Post your first job free
                  </Button>
                </Link>
              </Card>

              <Card className="border-0 border-t-[3px] border-accent-500 p-6">
                <p className="font-semibold text-slate-900">{employerPlan.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  R{employerPlan.amountZar}
                  <span className="text-base font-medium text-slate-500">/mo</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {EMPLOYER_PAID_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/27693391915?text=Hi%2C%20I%27d%20like%20to%20book%20a%20demo%20of%20Resume%20Hub%20for%20Employers"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="secondary" className="mt-6 w-full">
                    <MessageCircle className="h-4 w-4" />
                    Book a Demo
                  </Button>
                </a>
                <Link href="/signup">
                  <Button variant="outline" className="mt-2 w-full">
                    Subscribe directly
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <p className="text-sm text-slate-500">
              Have questions about pricing?{" "}
              <Link href="/faq" className="font-medium text-brand-600 hover:underline">
                Check the FAQ
              </Link>{" "}
              or{" "}
              <a href="mailto:info@resumehub.co.za" className="font-medium text-brand-600 hover:underline">
                email us
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
