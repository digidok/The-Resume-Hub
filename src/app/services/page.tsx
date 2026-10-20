import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  ClipboardList,
  FileText,
  GraduationCap,
  Landmark,
  Mail,
  MessageCircle,
  Repeat,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DocumentStudio } from "@/components/services/document-studio";
import { ClientsStrip } from "@/components/clients/clients-strip";
import { EnquiryForm } from "@/components/solutions/enquiry-form";
import { getAnyDivisionWithOverrides } from "@/lib/catalog/overrides";
import { whatsappLink } from "@/lib/whatsapp-contacts";

export const metadata = {
  title: "Resume Document Hub — Single Point of Contact Business Services",
  description:
    "Virtual assistants and business consultants: one point of contact for business registration, administration, HR policies, executive documentation, board packs, governance support and business automation.",
};

const MAIN_URL = whatsappLink("main", "Hi, I'd like to enquire about Resume Document Hub business services");
const SMALL_BUSINESS_URL = whatsappLink(
  "smallBusiness",
  "Hi, I'd like to enquire about small business services at Resume Document Hub",
);
const CORPORATE_URL = whatsappLink(
  "corporate",
  "Hi, I'd like to enquire about corporate and board support at Resume Document Hub",
);

type ServiceArea = {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
};

type Package = { name: string; price: string; level: string };

const SMALL_BUSINESS_AREAS: ServiceArea[] = [
  {
    icon: FileText,
    title: "Company registration & compliance",
    description:
      "For start-ups and entrepreneurs getting a business off the ground across South Africa.",
    items: ["CIPC company registration assistance — R650"],
  },
  {
    icon: Briefcase,
    title: "Everyday business administration",
    description:
      "Reliable admin for small and growing businesses that don't need a full-time hire.",
    items: [
      "Purchase order and delivery tracking",
      "Standard operating procedures",
      "Project administration and status reporting",
      "Document version control",
      "Customer enquiry and service-request management",
    ],
  },
  {
    icon: Bot,
    title: "AI, automation & business systems",
    description:
      "We build the workflows behind the admin, the same kind of automation that runs Resume Hub itself.",
    items: [
      "Automated invoice and payment reminders",
      "WhatsApp customer-service assistant",
      "Employee onboarding workflows",
      "Automated document generation",
      "Deadline notifications and approval workflows",
      "Management dashboards and performance reporting",
      "Integration of existing business systems",
    ],
  },
];

const HR_AREA: ServiceArea = {
  icon: ClipboardList,
  title: "HR policies & people documentation",
  description:
    "Clear, consistent HR documents for growing teams, prepared to your structure and brand.",
  items: [
    "HR policies and procedures",
    "Employee handbooks",
    "Leave, conduct and disciplinary policy templates",
    "Job descriptions",
    "Offer letter and employment documentation templates",
    "Induction packs for new employees",
  ],
};

const SMALL_BUSINESS_PACKAGES: Package[] = [
  { name: "Small Business Admin", price: "R1,499", level: "5 hours of administration" },
  {
    name: "Business Support Plus",
    price: "R2,999",
    level: "10 hours plus defined bookkeeping support",
  },
];

const CORPORATE_AREAS: ServiceArea[] = [
  {
    icon: Users,
    title: "Executive secretariat & board support",
    description:
      "Professional, confidential and reliable support for boards of directors, executive committees, CEOs, company secretaries and senior management.",
    items: [
      "Board and committee minute-taking",
      "Executive transcription and decision records",
      "Board pack compilation and quality assurance",
      "Agenda preparation and meeting coordination",
      "Board resolutions and action registers",
      "Executive diary and correspondence management",
      "Confidential document management and version control",
      "Executive presentation preparation — from R1,500",
      "Monthly executive office support retainer — from R7,500/month",
    ],
  },
  {
    icon: Landmark,
    title: "Governance & company secretariat support",
    description:
      "Governance documentation and compliance tracking for corporate engagements, monthly retainers and project-based assignments.",
    items: [
      "Governance register maintenance — from R1,500/month",
      "Director declarations and interests register administration — from R1,250",
      "Board resolution register maintenance — from R1,250",
      "Governance document review and formatting — from R1,500",
      "Board action tracking and follow-up reports — from R1,500/month",
    ],
  },
];

const CORPORATE_PACKAGES: Package[] = [
  { name: "Executive Office", price: "R7,500", level: "Defined executive administration" },
  { name: "Board Secretariat", price: "R12,500", level: "Defined board and committee support" },
  { name: "Corporate Governance", price: "R20,000+", level: "Multiple governance workstreams" },
];

const HIGHLIGHTS = [
  { icon: UserCheck, title: "One accountable contact", text: "A single person owns your request from quote to delivery." },
  { icon: ShieldCheck, title: "Confidential by default", text: "Professional, discreet handling of sensitive board and business documents." },
  { icon: Repeat, title: "Once-off or retainer", text: "Pay for a single service or subscribe monthly for ongoing support." },
  { icon: Landmark, title: "Based in Sandton", text: "Serving businesses and boards across South Africa." },
];

const STEPS = [
  { title: "Tell us what you need", text: "Message us on WhatsApp or email. Describe the task, the deadline and who it is for." },
  { title: "We scope and quote", text: "You receive a clear scope and price, either once-off or as a monthly package." },
  { title: "One contact delivers", text: "Your assistant manages the work and keeps you updated until it is complete." },
];

function SectionHeading({
  number,
  eyebrow,
  title,
  intro,
}: {
  number: string;
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-accent-600">
        <span className="font-mono">{number}</span>
        <span className="h-px w-8 bg-accent-400" />
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-4 text-slate-600">{intro}</p>
    </div>
  );
}

function AreaCard({ area }: { area: ServiceArea }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-900 text-accent-400">
          <area.icon className="h-5 w-5" />
        </span>
        <h3 className="font-semibold text-slate-900">{area.title}</h3>
      </div>
      <p className="mt-4 text-sm text-slate-600">{area.description}</p>
      <ul className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
        {area.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PackageGrid({
  packages,
  quoteLabel,
  quoteUrl,
}: {
  packages: Package[];
  quoteLabel: string;
  quoteUrl: string;
}) {
  return (
    <div
      className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${
        packages.length >= 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {packages.map((pkg) => (
        <div key={pkg.name} className="rounded-md border border-slate-200 border-t-2 border-t-accent-400 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{pkg.name}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {pkg.price}
            <span className="text-base font-medium text-slate-500">/mo</span>
          </p>
          <p className="mt-3 text-sm text-slate-600">{pkg.level}</p>
        </div>
      ))}
      <div className="flex flex-col justify-between rounded-md bg-brand-900 p-6 text-white shadow-sm">
        <div>
          <p className="font-semibold">Need something specific?</p>
          <p className="mt-3 text-sm text-slate-300">{quoteLabel}</p>
        </div>
        <a
          href={quoteUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-accent-400 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-accent-50"
        >
          <MessageCircle className="h-4 w-4" />
          Request a quote
        </a>
      </div>
    </div>
  );
}

export default async function ServicesPage() {
  const executiveDivision = (await getAnyDivisionWithOverrides("executive-board-support"))!;
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-brand-950 text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,147,63,0.18),transparent_55%)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="inline-block rounded-sm border border-accent-400/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-400">
                Single Point of Contact
              </p>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.1]">
                Executive office and board support, delivered with discretion
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">
                Virtual assistants and business consultants for boards, executive committees and senior
                teams: secretariat, governance documentation, board packs and business documents
                prepared to your brand. One accountable contact from quote to delivery.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={MAIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-brand-950 hover:bg-accent-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Request a consultation
                </a>
                <a
                  href="#studio"
                  className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <FileText className="h-4 w-4" />
                  Start a document request
                </a>
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">What we handle</p>
              <ul className="mt-4 divide-y divide-white/10">
                {[
                  { icon: Users, label: "Executive secretariat & board support", href: "#corporate" },
                  { icon: Landmark, label: "Governance & company secretariat", href: "#corporate" },
                  { icon: FileText, label: "Document Studio: plans, packs, minutes, HR policies", href: "#studio" },
                  { icon: Briefcase, label: "Business administration & registration", href: "#small-business" },
                  { icon: Bot, label: "AI, automation & business systems", href: "#small-business" },
                  { icon: GraduationCap, label: "CV writing, ATS scoring & auto-apply", href: "/careers" },
                ].map((row) => (
                  <li key={row.label}>
                    <a href={row.href} className="group flex items-center gap-3 py-3 text-sm text-slate-100 hover:text-white">
                      <row.icon className="h-4 w-4 shrink-0 text-accent-400" />
                      <span className="flex-1">{row.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ClientsStrip />

        <section id="corporate" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading
              number="01"
              eyebrow="Corporate and boards"
              title="Executive secretariat, board support & governance"
              intro="Your executive office support, delivered with precision, discretion and accountability. For corporate engagements, monthly retainers and project-based assignments."
            />
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2">
              {CORPORATE_AREAS.map((area) => (
                <AreaCard key={area.title} area={area} />
              ))}
            </div>
            <h3 className="mt-14 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Monthly retainers
            </h3>
            <PackageGrid
              packages={CORPORATE_PACKAGES}
              quoteLabel="Project-based assignments and corporate retainers are scoped to your needs."
              quoteUrl={CORPORATE_URL}
            />
            <p className="mt-8 max-w-3xl text-xs text-slate-500">
              Prices are indicative. Statutory fees and third-party costs are quoted separately, and
              the hours and deliverables in each package are confirmed in your service agreement.
              Formal governance appointments and regulated services are handled by appropriately
              qualified professionals.
            </p>
          </div>
        </section>

        <section id="studio" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading
              number="02"
              eyebrow="Document Studio"
              title="Board-ready documents, prepared to your brand"
              intro="Choose the document you need, select a template style, add your logo and source material, and submit one request. Your assistant prepares the document, applies your branding and returns it for review. Recordings are transcribed by our team."
            />
            <div className="mt-10">
              <DocumentStudio />
            </div>
          </div>
        </section>

        <section id="small-business" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading
              number="03"
              eyebrow="Small business and start-ups"
              title="Business administration & virtual office solutions"
              intro="Your one-stop partner for business registration, administration, branding and ongoing business support, for entrepreneurs, small businesses, consultants, freelancers and start-ups across South Africa. Pay once off for a single service, or subscribe monthly for ongoing support."
            />
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2">
              {[...SMALL_BUSINESS_AREAS, HR_AREA].map((area) => (
                <AreaCard key={area.title} area={area} />
              ))}
            </div>
            <h3 className="mt-14 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Monthly packages
            </h3>
            <PackageGrid
              packages={SMALL_BUSINESS_PACKAGES}
              quoteLabel="Tell us what you need and we'll scope a once-off service or a custom monthly plan."
              quoteUrl={SMALL_BUSINESS_URL}
            />
          </div>
        </section>

        <section id="process" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading
              number="04"
              eyebrow="How it works"
              title="From first message to finished work"
              intro="A simple, accountable process with one point of contact throughout."
            />
            <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="font-mono text-sm font-semibold text-accent-600">0{i + 1}</span>
                  <p className="mt-3 font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="enquiry" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Request a quote</h2>
            <p className="mt-2 text-sm text-slate-600">
              Share the meeting details and what you need. Verbatim transcripts, formal minutes and executive
              summaries are different deliverables, and AI-assisted drafts are always reviewed by a person before
              they are final.
            </p>
            <div className="mt-6">
              <EnquiryForm division={executiveDivision} />
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 bg-brand-900 py-16 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Speak to one person who owns it end to end
              </h2>
              <p className="mt-3 text-slate-300">
                For corporate engagements, monthly retainers and project-based assignments, reach
                us on WhatsApp or email and we will respond with a scope and quote.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={MAIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-accent-400 px-6 py-3 text-sm font-semibold text-brand-950 hover:bg-accent-50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
              <a
                href="mailto:info@resumehub.co.za"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                <Mail className="h-4 w-4" />
                Email us
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
