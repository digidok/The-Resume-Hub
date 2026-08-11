import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Terms of Service — Resume Hub",
  description: "The terms that govern your use of Resume Hub.",
};

const SECTIONS = [
  {
    title: "1. Who this agreement is with",
    body: `These terms govern your use of Resume Hub, a resume-building and job-matching platform operated for candidates and employers in South Africa. By creating an account or using the site, you agree to these terms.`,
  },
  {
    title: "2. Your account",
    body: `You must provide accurate information when you sign up and keep your login details secure. You're responsible for activity on your account. You must be at least 16 years old to create an account.`,
  },
  {
    title: "3. Candidate accounts",
    body: `Candidate accounts can build resumes, apply to jobs, and use AI-assisted tools like CV review, auto-apply, and mock interviews. The content of your resume and applications is yours — you own what you write, and we host it to provide the service. You're responsible for the accuracy of the information you submit to employers.`,
  },
  {
    title: "4. Employer accounts",
    body: `Employer accounts can post jobs, review applicants, and manage hiring pipelines subject to the job posting and subscription limits shown on the Pricing page. Job posts must be genuine, currently open roles — we may remove listings that are misleading, discriminatory, or violate South African labour law.`,
  },
  {
    title: "5. AI-assisted features",
    body: `Features like resume review, auto-apply matching, mock interviews, and AI-generated cover letters use Anthropic's Claude models to analyse and generate content based on what you provide. AI output is a starting point, not guaranteed advice — you're responsible for reviewing anything generated before you send it to an employer. Credit-metered AI features are billed as described on the Pricing page.`,
  },
  {
    title: "6. Payments",
    body: `Paid plans and credit top-ups are processed through Payfast. Subscriptions renew automatically until cancelled from your account settings. Credit purchases are non-refundable once the credits have been used. See the Pricing page for current amounts, all in South African Rand.`,
  },
  {
    title: "7. Acceptable use",
    body: `You may not use Resume Hub to post fraudulent job listings, scrape or resell platform data, submit false credentials, harass other users, or attempt to bypass credit limits or security controls. We may suspend or terminate accounts that violate this.`,
  },
  {
    title: "8. Availability",
    body: `We aim to keep Resume Hub available and reliable, but we don't guarantee uninterrupted access. Features that depend on third-party services (payments, email, AI) may be temporarily affected by outages outside our control.`,
  },
  {
    title: "9. Limitation of liability",
    body: `Resume Hub is provided "as is." We're not liable for hiring decisions, job outcomes, or the accuracy of AI-generated suggestions. To the extent permitted by South African law, our liability for any claim is limited to the amount you paid us in the 12 months before the claim.`,
  },
  {
    title: "10. Changes to these terms",
    body: `We may update these terms as the platform evolves. We'll notify you of material changes via email or an in-app notice. Continuing to use Resume Hub after a change takes effect means you accept the updated terms.`,
  },
  {
    title: "11. Governing law",
    body: `These terms are governed by the laws of South Africa. Any dispute will be subject to the jurisdiction of the South African courts.`,
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated 11 August 2026</p>
          <p className="mt-4 text-slate-600">
            These terms explain what you can expect from Resume Hub, and what we expect from you,
            as a candidate or employer using the platform.
          </p>

          <Card className="mt-8 space-y-6 p-6 sm:p-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.body}</p>
              </div>
            ))}
          </Card>

          <p className="mt-8 text-sm text-slate-500">
            Questions about these terms? Email{" "}
            <a href="mailto:info@resumehub.co.za" className="font-medium text-brand-700 hover:underline">
              info@resumehub.co.za
            </a>{" "}
            or message us on WhatsApp at 069 339 1915.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
