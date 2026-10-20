import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Check,
  FileText,
  Landmark,
  Mail,
  MessageCircle,
  UserRound,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { whatsappLink } from "@/lib/whatsapp-contacts";

export const metadata = {
  title: "Resume Document Hub — Single Point of Contact Business Services",
  description:
    "One point of contact for business registration, administration, branding, executive documentation, board packs, governance support and business automation.",
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

function AreaCard({ area }: { area: ServiceArea }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <area.icon className="h-5 w-5" />
        </span>
        <h3 className="font-semibold text-slate-900">{area.title}</h3>
      </div>
      <p className="mt-3 text-sm text-slate-600">{area.description}</p>
      <ul className="mt-4 space-y-2.5">
        {area.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {item}
          </li>
        ))}
      </ul>
    </Card>
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
      className={`mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 ${
        packages.length >= 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      }`}
    >
      {packages.map((pkg) => (
        <Card key={pkg.name} className="p-6">
          <p className="font-semibold text-slate-900">{pkg.name}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {pkg.price}
            <span className="text-base font-medium text-slate-500">/mo</span>
          </p>
          <p className="mt-3 text-sm text-slate-600">{pkg.level}</p>
        </Card>
      ))}
      <Card className="flex flex-col justify-between border-0 border-t-[3px] border-accent-500 p-6">
        <div>
          <p className="font-semibold text-slate-900">Need something specific?</p>
          <p className="mt-3 text-sm text-slate-600">{quoteLabel}</p>
        </div>
        <a href={quoteUrl} target="_blank" rel="noreferrer">
          <Button variant="secondary" className="mt-6 w-full">
            <MessageCircle className="h-4 w-4" />
            Request a quote
          </Button>
        </a>
      </Card>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Resume Document Hub
          </p>
          <p className="mt-2 inline-block rounded-full bg-accent-50 px-4 py-1 text-sm font-semibold text-accent-700">
            Single Point of Contact
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            One team for your admin, documents and business support
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Business registration, professional branding, virtual assistance, executive
            documentation, board packs and corporate governance support. Tell us what you need on
            WhatsApp and one person owns it from quote to delivery.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={MAIN_URL} target="_blank" rel="noreferrer">
              <Button size="lg">
                <MessageCircle className="h-4 w-4" />
                Chat to your assistant
              </Button>
            </a>
            <a href="mailto:info@resumehub.co.za">
              <Button size="lg" variant="outline">
                <Mail className="h-4 w-4" />
                info@resumehub.co.za
              </Button>
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link href="/" className="group">
              <Card className="h-full p-6 transition-colors group-hover:border-brand-300">
                <UserRound className="h-6 w-6 text-brand-600" />
                <p className="mt-3 font-semibold text-slate-900">Job seekers</p>
                <p className="mt-1 text-sm text-slate-600">
                  CVs, cover letters, interview prep, job matching and AI application tools.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  Go to CVs and jobs <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
            <a href="#small-business" className="group">
              <Card className="h-full p-6 transition-colors group-hover:border-brand-300">
                <Building2 className="h-6 w-6 text-brand-600" />
                <p className="mt-3 font-semibold text-slate-900">Small business</p>
                <p className="mt-1 text-sm text-slate-600">
                  Registration, admin, automation and monthly support for start-ups and growing
                  businesses.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  CIPC registration R650 <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </a>
            <a href="#corporate" className="group">
              <Card className="h-full p-6 transition-colors group-hover:border-brand-300">
                <Landmark className="h-6 w-6 text-brand-600" />
                <p className="mt-3 font-semibold text-slate-900">Corporate and boards</p>
                <p className="mt-1 text-sm text-slate-600">
                  Executive secretariat, board packs and governance support for senior teams.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  Retainers from R7,500/mo <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </a>
          </div>
        </section>

        <section id="small-business" className="scroll-mt-20 bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Small business and start-ups
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Business administration &amp; virtual office solutions
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Your one-stop partner for business registration, administration, branding and ongoing
              business support, for entrepreneurs, small businesses, consultants, freelancers and
              start-ups across South Africa. Pay once off for a single service, or subscribe monthly
              for ongoing support.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2">
              {SMALL_BUSINESS_AREAS.map((area) => (
                <AreaCard key={area.title} area={area} />
              ))}
            </div>
            <h3 className="mt-12 text-sm font-semibold uppercase tracking-wide text-brand-600">
              Monthly packages
            </h3>
            <PackageGrid
              packages={SMALL_BUSINESS_PACKAGES}
              quoteLabel="Tell us what you need and we'll scope a once-off service or a custom monthly plan."
              quoteUrl={SMALL_BUSINESS_URL}
            />
          </div>
        </section>

        <section id="corporate" className="scroll-mt-20 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Corporate and boards
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Executive secretariat, board support &amp; governance
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Your executive office support, delivered with precision, discretion and
              accountability. For corporate engagements, monthly retainers and project-based
              assignments.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2">
              {CORPORATE_AREAS.map((area) => (
                <AreaCard key={area.title} area={area} />
              ))}
            </div>
            <h3 className="mt-12 text-sm font-semibold uppercase tracking-wide text-brand-600">
              Monthly retainers
            </h3>
            <PackageGrid
              packages={CORPORATE_PACKAGES}
              quoteLabel="Project-based assignments and corporate retainers are scoped to your needs."
              quoteUrl={CORPORATE_URL}
            />
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-slate-500">
              Prices are indicative. Statutory fees and third-party costs are quoted separately, and
              the hours and deliverables in each package are confirmed in your service agreement.
              Formal governance appointments and regulated services are handled by appropriately
              qualified professionals.
            </p>
          </div>
        </section>

        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <p className="text-sm text-slate-600">
              For corporate engagements, monthly retainers and project-based assignments, contact{" "}
              <a
                href="mailto:info@resumehub.co.za"
                className="font-medium text-brand-600 hover:underline"
              >
                info@resumehub.co.za
              </a>
              . Looking for a CV or help finding a job?{" "}
              <Link href="/" className="font-medium text-brand-600 hover:underline">
                Visit the Resume Hub platform
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
