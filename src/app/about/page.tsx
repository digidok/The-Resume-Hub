import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "About Us — The Resume Document Hub",
  description:
    "The Resume Document Hub brings career tools, business administration, HR, executive support, data and automation together through one central point of contact.",
};

const PRINCIPLES = [
  {
    title: "One accountable contact",
    body: "You deal with one team from enquiry and quotation through to delivery, however many services your work involves.",
  },
  {
    title: "Clear about who does the work",
    body: "Some services are delivered directly by us. Others, such as background checks or regulated professional work, are fulfilled by external authorised providers and qualified practitioners. Each service page tells you which is which.",
  },
  {
    title: "Guidance, not guarantees",
    body: "AI-assisted tools and assessments support decisions. They do not promise a job, a hiring outcome or a business result, and important documents such as board minutes are reviewed by a person before they are final.",
  },
  {
    title: "Your information stays protected",
    body: "We collect only what a service needs, restrict access to sensitive documents, and handle personal information in line with POPIA.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-brand-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">About Us</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
              One Hub. Every Career. Every Business Solution.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-200">
              Resume Document Hub connects individuals, entrepreneurs, SMEs and established organisations with
              practical digital tools, professional expertise and integrated support.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">What we do</h2>
            <p className="mt-3 text-slate-600">
              We began with careers: CVs, job matching and tools that help people apply with confidence. We have grown
              into a business support partner offering administration, virtual assistants, executive and board
              support, HR and recruitment services, data intelligence, background screening coordination and
              automation.
            </p>
            <p className="mt-3 text-slate-600">
              We simplify career development and business administration by bringing essential services,
              professional support and intelligent automation together under one roof.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/careers" className="rounded-md bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
                Explore Career Solutions
              </Link>
              <Link href="/solutions" className="rounded-md border border-brand-200 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                Explore Business Solutions
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 p-5">
                <p className="font-semibold text-slate-900">{p.title}</p>
                <p className="mt-1 text-sm text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
