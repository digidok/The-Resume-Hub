import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pricing — Resume Hub",
  description:
    "Simple, transparent pricing for candidates and employers on Resume Hub — every candidate plan unlocks full access, no free tier, no credit limits.",
};
import { Card } from "@/components/ui/card";
import { SUBSCRIPTION_PACKAGES, PRO_ONCE_OFF_PACKAGE } from "@/lib/payfast/config";

const candidatePro = SUBSCRIPTION_PACKAGES.find((p) => p.role === "candidate")!;
const employerPlan = SUBSCRIPTION_PACKAGES.find((p) => p.role === "employer")!;

const CANDIDATE_PLAN_FEATURES = [
  "Full library of 100+ templates, including Executive Portfolio",
  "Unlimited AI resume review, generation & ATS scoring",
  "Unlimited mock interviews, resume translation & salary insights",
  "Scheduled auto-apply",
  "Print / download as PDF, no watermark",
  "Apply to jobs, unlimited — save & track applications",
  "Career Passport",
];

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
            Every candidate plan unlocks full access to Resume Hub — no free tier, no credit
            limits, nothing metered.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-brand-600">
            For job seekers
          </h2>
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="p-6">
              <p className="font-semibold text-slate-900">{PRO_ONCE_OFF_PACKAGE.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                R{PRO_ONCE_OFF_PACKAGE.amountZar}
                <span className="text-base font-medium text-slate-500"> once-off</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">No recurring billing — full access for 30 days.</p>
              <ul className="mt-5 space-y-2.5">
                {CANDIDATE_PLAN_FEATURES.map((f) => (
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
                {CANDIDATE_PLAN_FEATURES.map((f) => (
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
