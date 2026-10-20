import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PrivacyRequestForm } from "@/components/privacy/privacy-request-form";

export const metadata = {
  title: "Privacy and communication preferences — The Resume Document Hub",
  description: "Ask to access, correct or delete your information, or stop marketing communications.",
};

export default function PrivacyRequestPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy and communication preferences</h1>
        <p className="mt-3 text-slate-600">
          Under POPIA you can ask what personal information we hold, ask us to correct or delete it, or stop marketing
          messages. Transactional emails about your own requests, quotes and invoices continue while you have an active
          service with us. Read our{" "}
          <a href="/privacy" className="font-medium text-brand-600 underline">
            privacy policy
          </a>
          .
        </p>
        <div className="mt-8">
          <PrivacyRequestForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
