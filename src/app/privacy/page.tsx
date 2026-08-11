import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy — Resume Hub",
};

const SECTIONS = [
  {
    title: "1. What we collect",
    body: `We collect the information you give us directly — your name, email, phone number, resume content (including work history, education, and an optional photo), job applications, and messages you send us. We also collect basic usage data (pages visited, actions taken) to keep the platform working and improve it.`,
  },
  {
    title: "2. Why we collect it",
    body: `We use your information to operate your account, build and host your resume, match you with relevant jobs, run AI-assisted features you request (like resume review, auto-apply, and mock interviews), process payments, and communicate with you about your applications and account.`,
  },
  {
    title: "3. Who we share it with",
    body: `We share data with the service providers that power Resume Hub: Supabase (database, authentication, and file storage), Anthropic (AI features you actively use, such as resume review and auto-apply matching), Payfast (payment processing), and Resend (transactional email). We share your resume and application with an employer only when you apply to their job or make your resume public. We do not sell your personal information.`,
  },
  {
    title: "4. Your rights under POPIA",
    body: `As a South African business, Resume Hub processes personal information in line with the Protection of Personal Information Act, 2013 (POPIA). You have the right to: know what personal information we hold about you; request a copy of it; ask us to correct or delete it; object to or restrict certain processing; and withdraw consent at any time where processing is based on consent. To exercise any of these rights, contact us at info@resumehub.co.za or via WhatsApp on 069 339 1915, and we'll respond within a reasonable time. If you're not satisfied with our response, you may lodge a complaint with South Africa's Information Regulator (inforegulator.org.za).`,
  },
  {
    title: "5. Data retention",
    body: `We keep your account and resume data for as long as your account is active. If you delete your account, we remove your personal data within a reasonable period, except where we're required to keep records for legal, tax, or fraud-prevention purposes.`,
  },
  {
    title: "6. Security",
    body: `We use industry-standard measures to protect your data, including encrypted connections, access controls, and row-level security on our database so that only you (and, where relevant, the employers you apply to) can see your information.`,
  },
  {
    title: "7. Cookies",
    body: `We use essential cookies to keep you signed in and remember your preferences. We don't use third-party advertising trackers.`,
  },
  {
    title: "8. Changes to this policy",
    body: `We may update this policy from time to time. If we make material changes, we'll let you know via email or an in-app notice.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated 11 August 2026</p>
          <p className="mt-4 text-slate-600">
            This policy explains what personal information Resume Hub collects, how we use it, and
            the rights you have over it — including under South Africa&apos;s Protection of
            Personal Information Act (POPIA).
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
            Questions about your data? Email{" "}
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
