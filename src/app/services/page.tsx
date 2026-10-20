import Link from "next/link";
import {
  Bot,
  Briefcase,
  Check,
  FileText,
  Landmark,
  Mail,
  MessageCircle,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Business & Executive Services — Resume Hub",
  description:
    "From everyday business administration to boardroom excellence: business registration, professional branding, virtual assistance, executive documentation, board packs, governance support and business automation.",
};

const WHATSAPP_URL =
  "https://wa.me/27693391915?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20Resume%20Hub%20business%20services";

const MONTHLY_PACKAGES = [
  {
    name: "Small Business Admin",
    price: "R1,499",
    level: "5 hours of administration",
  },
  {
    name: "Business Support Plus",
    price: "R2,999",
    level: "10 hours plus defined bookkeeping support",
  },
  {
    name: "Executive Office",
    price: "R7,500",
    level: "Defined executive administration",
  },
  {
    name: "Board Secretariat",
    price: "R12,500",
    level: "Defined board and committee support",
  },
  {
    name: "Corporate Governance",
    price: "R20,000+",
    level: "Multiple governance workstreams",
  },
];

const SERVICE_AREAS = [
  {
    icon: Briefcase,
    title: "Everyday business administration",
    description:
      "Volume-driven support for small and growing businesses that need reliable admin without a full-time hire.",
    items: [
      "Purchase order and delivery tracking",
      "Standard operating procedures",
      "Project administration and status reporting",
      "Document version control",
      "Customer enquiry and service-request management",
    ],
  },
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

export default function ServicesPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Business &amp; executive services
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From everyday business administration to boardroom excellence
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            One service provider for business registration, professional branding, virtual
            assistance, executive documentation, board packs and corporate governance support.
            Whether you need a few hours of admin a month or a full board secretariat, you deal with
            one team.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <Button size="lg">
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {SERVICE_AREAS.map((area) => (
              <Card key={area.title} className="p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <area.icon className="h-5 w-5" />
                  </span>
                  <h2 className="font-semibold text-slate-900">{area.title}</h2>
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
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-brand-600">
              Monthly packages
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
              Choose the level of support that fits your business. Prices are indicative.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MONTHLY_PACKAGES.map((pkg) => (
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
                  <p className="mt-3 text-sm text-slate-600">
                    Project-based assignments and corporate retainers are scoped to your needs.
                  </p>
                </div>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="mt-6 w-full">
                    <MessageCircle className="h-4 w-4" />
                    Request a quote
                  </Button>
                </a>
              </Card>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-500">
              Statutory fees and third-party costs are quoted separately. Hours and deliverables
              included in each package are confirmed in your service agreement. Formal governance
              appointments and regulated services are handled by appropriately qualified
              professionals.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <FileText className="mx-auto h-8 w-8 text-brand-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Your executive office support, delivered with precision, discretion and accountability
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              For corporate engagements, monthly retainers and project-based assignments, contact{" "}
              <a
                href="mailto:info@resumehub.co.za"
                className="font-medium text-brand-600 hover:underline"
              >
                info@resumehub.co.za
              </a>
              . Looking for a CV or job-search help instead?{" "}
              <Link href="/pricing" className="font-medium text-brand-600 hover:underline">
                See candidate pricing
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
