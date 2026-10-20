// Central service catalogue for The Resume Document Hub.
// Pricing, descriptions and availability for every business division live here;
// landing pages, the pricing page, enquiry forms, navigation and the sitemap
// all read from this file. Change a price or service once and it updates everywhere.
// Admins can also override prices and availability from the dashboard
// (see src/lib/catalog/overrides.ts); the values here are the defaults.

import { JOB_SEEKER_CVS_LABEL } from "@/lib/site-constants";
import { INTERVIEW_PACK_PACKAGES, SUBSCRIPTION_PACKAGES, WHATSAPP_ORDER_PRICING } from "@/lib/payfast/config";

export type PriceModel = "once-off" | "monthly" | "quote";

export type CatalogService = {
  id: string;
  name: string;
  description: string;
  /** Models this service is sold under. */
  models: PriceModel[];
  /** Starting price in ZAR. Omit for "Request a Quote". */
  fromZar?: number;
  /** Set false to hide from pages and forms without deleting. */
  available?: boolean;
};

export type EnquiryExtraField = {
  name: string;
  label: string;
  type: "text" | "select" | "textarea" | "checkboxes";
  options?: string[];
  required?: boolean;
};

export type Division = {
  slug: string;
  /** Short label for navigation. */
  navLabel: string;
  title: string;
  tagline: string;
  intro: string;
  /** Route of the landing page. */
  href: string;
  /** "individual" funnels (careers) hide the business-name field. */
  audience?: "business" | "individual";
  /** Plain-language statement of who fulfils the work. */
  fulfilment: string;
  /** Important qualifications shown on the page. */
  notices: string[];
  services: CatalogService[];
  extraFields?: EnquiryExtraField[];
};

export const MODEL_LABEL: Record<PriceModel, string> = {
  "once-off": "Once-off",
  monthly: "Monthly",
  quote: "Quote",
};

export const DIVISIONS: Division[] = [
  {
    slug: "business-administration",
    navLabel: "Business Solutions",
    title: "Business administration",
    tagline: "An outsourced administrative partner for entrepreneurs, SMEs and established businesses.",
    intro:
      "Company registration support, virtual assistants and professional business documents, delivered once-off or as a monthly package.",
    href: "/solutions/business-administration",
    fulfilment:
      "Delivered directly by Resume Document Hub. Company filings are submitted through the relevant authority; any third-party fees are quoted separately.",
    notices: [
      "We provide administrative assistance only. We do not give legal, tax or accounting advice; where a registered professional is needed we will say so and refer you.",
      "Third-party fees (for example CIPC fees) and any required professional approvals are shown on your quotation.",
    ],
    services: [
      { id: "ba-cipc", name: "CIPC company registration assistance", description: "Preparing and submitting your company registration. Third-party fees quoted separately.", models: ["once-off"], fromZar: 650 },
      { id: "ba-amendments", name: "Company amendments and filings", description: "Director and company-detail changes and applicable filing support.", models: ["once-off"] },
      { id: "ba-profile", name: "Business profile and capability statement", description: "A professional profile for clients, tenders and funders.", models: ["once-off"] },
      { id: "ba-supplier", name: "Supplier database registration", description: "Assistance with registering on supplier databases.", models: ["once-off"] },
      { id: "ba-bbbee", name: "B-BBEE documentation coordination", description: "Gathering and organising the documents your B-BBEE process needs.", models: ["once-off"] },
      { id: "ba-records", name: "Company records and deadlines", description: "Keeping company records and tracking statutory deadlines.", models: ["monthly"] },
      { id: "ba-va-monthly", name: "Virtual assistant: monthly package", description: "Email and calendar management, scheduling, data capture, research, follow-ups, CRM administration and enquiry handling.", models: ["monthly"], fromZar: 1499 },
      { id: "ba-va-once", name: "Virtual assistant: once-off task", description: "Document preparation, formatting, spreadsheets, research or correspondence as a single job.", models: ["once-off", "quote"] },
      { id: "ba-docs", name: "Business documentation", description: "Quotations, invoices, proposals, company profiles, policies, SOPs, reports and presentations.", models: ["once-off", "quote"] },
      { id: "ba-tender", name: "Supplier and tender documentation support", description: "Compiling and checking tender and supplier submissions.", models: ["once-off", "quote"] },
    ],
  },
  {
    slug: "executive-board-support",
    navLabel: "Executive & Board Support",
    title: "Executive & board support",
    tagline: "A premium service for directors, executives, boards, committees, NPOs and professional organisations.",
    intro:
      "Board packs, agendas, professional minutes, transcription and executive assistance, handled with discretion.",
    href: "/services",
    fulfilment: "Delivered directly by Resume Document Hub's executive support team under confidentiality terms.",
    notices: [
      "Verbatim transcription, formal minutes and executive summaries are different deliverables, and we quote them separately.",
      "AI-assisted drafts are always reviewed by a person before they are presented as final minutes.",
    ],
    services: [
      { id: "eb-pack", name: "Board pack preparation", description: "Compiled, paginated board and committee packs.", models: ["once-off", "monthly"] },
      { id: "eb-agenda", name: "Agenda preparation", description: "Board and committee agendas.", models: ["once-off", "monthly"] },
      { id: "eb-minutes", name: "Professional minute-taking", description: "Accurate, impartial, professionally structured minutes.", models: ["once-off", "monthly"] },
      { id: "eb-transcription", name: "Verbatim transcription", description: "Word-for-word transcript of a recording. Not the same as minutes.", models: ["once-off", "quote"] },
      { id: "eb-coord", name: "Executive meeting coordination", description: "Scheduling, logistics, follow-ups and deadline monitoring.", models: ["monthly"], fromZar: 7500 },
      { id: "eb-registers", name: "Action registers and decision logs", description: "Tracking resolutions, actions and decisions.", models: ["monthly"] },
      { id: "eb-diary", name: "Executive diary and correspondence", description: "Confidential diary, email and document management.", models: ["monthly"], fromZar: 7500 },
      { id: "eb-gov", name: "Governance documentation", description: "Policies, procedures and governance registers.", models: ["once-off", "monthly"] },
      { id: "eb-contract", name: "Recurring board and committee support", description: "A contract covering your full meeting cycle.", models: ["monthly", "quote"], fromZar: 12500 },
    ],
    extraFields: [
      { name: "meetingDuration", label: "Meeting duration", type: "text" },
      { name: "attendees", label: "Number of attendees", type: "text" },
      { name: "recording", label: "Is a recording available?", type: "select", options: ["Yes", "No", "Not sure"] },
      { name: "confidentiality", label: "Confidentiality requirements", type: "textarea" },
      { name: "deliverables", label: "Expected deliverables", type: "checkboxes", options: ["Verbatim transcript", "Formal minutes", "Executive summary", "Action register", "Board pack"] },
    ],
  },
  {
    slug: "hr-recruitment",
    navLabel: "HR & Recruitment",
    title: "HR & recruitment solutions",
    tagline: "Outsource selected HR administration functions, or request individual services.",
    intro:
      "Recruitment administration, employment documentation and day-to-day HR admin, built on our recruitment and HR experience.",
    href: "/solutions/hr-recruitment",
    fulfilment:
      "Administration is delivered by Resume Document Hub. Regulated or specialist work, such as labour-relations advice, is done by appropriately qualified practitioners.",
    notices: [
      "We prepare documents and administer processes. We do not replace legal advice on dismissals, disputes or other labour-law matters.",
    ],
    services: [
      { id: "hr-recruit", name: "Recruitment administration", description: "Advert drafting, candidate screening coordination and interview scheduling.", models: ["once-off", "monthly"] },
      { id: "hr-jd", name: "Job descriptions", description: "Clear, consistent job descriptions.", models: ["once-off"] },
      { id: "hr-docs", name: "Employment documentation", description: "Contracts, offer letters and supporting employment documents.", models: ["once-off"] },
      { id: "hr-onboard", name: "Onboarding and offboarding", description: "Checklists, induction packs and exit administration.", models: ["once-off", "monthly"] },
      { id: "hr-files", name: "Employee file management", description: "Organised, complete employee files.", models: ["monthly"] },
      { id: "hr-leave", name: "Leave and attendance administration", description: "Tracking leave and attendance records.", models: ["monthly"] },
      { id: "hr-payroll", name: "Payroll input preparation", description: "Preparing and coordinating payroll inputs for your payroll provider.", models: ["monthly"] },
      { id: "hr-perf", name: "Performance management documentation", description: "Appraisal forms and performance records.", models: ["once-off", "monthly"] },
      { id: "hr-policy", name: "HR policies and procedures", description: "Policies and employee handbooks.", models: ["once-off"] },
      { id: "hr-training", name: "Training and skills-development administration", description: "Training records and skills-development paperwork.", models: ["monthly"] },
      { id: "hr-planning", name: "Workforce planning support", description: "Headcount and capacity planning support.", models: ["quote"] },
      { id: "hr-lr", name: "Labour-relations document preparation", description: "Document preparation and meeting administration.", models: ["quote"] },
    ],
  },
  {
    slug: "labour-broking",
    navLabel: "Labour Broking",
    title: "Labour broking & temporary employment services",
    tagline: "Staff placed with you, employed and paid by us. We run the payroll and the administration.",
    intro: `Tell us the roles and numbers you need. We find suitable people from our job-seeker database of ${JOB_SEEKER_CVS_LABEL} CVs, employ them, pay their salaries and handle their employment administration, while you direct their day-to-day work.`,
    href: "/solutions/labour-broking",
    fulfilment:
      "Placed workers are employed by Resume Document Hub, which runs their payroll, pays their salaries and handles their employment administration. You direct the daily work at your site. The arrangement, the placement length and our fees are set out in a written agreement before anyone starts.",
    notices: [
      "Placements follow South African labour law, including the rules that apply to temporary employment services. We confirm the legal basis of every placement in writing before it starts.",
      "Fees are quoted for each request. We do not publish fixed prices.",
      "Candidates are put forward and checked only with their consent. Background screening is available as an optional extra.",
    ],
    services: [
      { id: "lb-temp", name: "Temporary placements", description: "Short-term cover for absences, peak periods and urgent vacancies. We employ and pay the worker.", models: ["quote"] },
      { id: "lb-fixed", name: "Fixed-term and contract placements", description: "Staff placed for an agreed period, with contracts, payroll and employment administration handled by us.", models: ["quote"] },
      { id: "lb-project", name: "Project and seasonal staffing", description: "A team assembled and employed by us for your project, campaign or seasonal peak.", models: ["quote"] },
      { id: "lb-payroll", name: "Payroll and salary administration", description: "Salaries paid, payslips issued, and leave and attendance administered for the staff we place with you.", models: ["quote", "monthly"] },
      { id: "lb-managed", name: "Managed workforce", description: "A standing pool of staff for ongoing needs, fully employed and administered by us.", models: ["quote", "monthly"] },
    ],
    extraFields: [
      { name: "roles", label: "Roles and how many people you need", type: "textarea", required: true },
      { name: "duration", label: "Expected duration of the placement", type: "text" },
      { name: "start", label: "Start date", type: "text" },
      { name: "location", label: "Work location", type: "text" },
      { name: "extras", label: "Optional extras", type: "checkboxes", options: ["Background screening", "Onboarding administration", "Attendance reporting"] },
    ],
  },
  {
    slug: "data-intelligence",
    navLabel: "Data Science & BI",
    title: "Data science & business intelligence",
    tagline: "Turn business data into actionable intelligence.",
    intro:
      "Reporting, dashboards and HR analytics for businesses that want evidence-based decisions without a full-time data analyst.",
    href: "/solutions/data-intelligence",
    fulfilment:
      "Delivered directly by Resume Document Hub using suitable tools such as Excel, Power BI, SQL or Python, depending on your data.",
    notices: [
      "Starting prices are indicative. Final prices reflect complexity, software costs, delivery time and the level of validation required.",
      "We scope advanced analytics to your available data and validated methods, and we do not promise predictive accuracy or business outcomes without proper testing.",
    ],
    services: [
      { id: "da-review", name: "Data quality or spreadsheet review", description: "Cleaning, validation and a data quality assessment.", models: ["once-off"], fromZar: 750 },
      { id: "da-analysis", name: "Data analysis and management report", description: "Exploratory analysis, trends, KPIs and statistical summaries in a management report.", models: ["once-off"], fromZar: 1500 },
      { id: "da-hr", name: "HR analytics report", description: "Time-to-hire, cost-per-hire, turnover, absenteeism and skills-gap analysis.", models: ["once-off"], fromZar: 2500 },
      { id: "da-dashboard", name: "KPI dashboard prototype", description: "Sales, finance, operations, HR, recruitment or executive dashboards.", models: ["once-off"], fromZar: 3500 },
      { id: "da-automated", name: "Automated reporting workflow", description: "Scheduled processing, report generation and delivery through authorised channels.", models: ["once-off", "monthly"], fromZar: 3500 },
      { id: "da-advanced", name: "Advanced analytics", description: "Forecasting, segmentation, anomaly detection, statistical modelling and prototypes.", models: ["quote"] },
    ],
  },
  {
    slug: "background-screening",
    navLabel: "Background Screening",
    title: "Background screening & verification",
    tagline: "Employment screening coordination for employers, recruiters and HR teams.",
    intro:
      "We coordinate verification checks with authorised providers and track them from request to secure report delivery.",
    href: "/solutions/background-screening",
    fulfilment:
      "Checks are fulfilled through external authorised providers. Resume Document Hub coordinates the process; we are not a credit bureau and are not an accredited screening provider.",
    notices: [
      "Availability of each check depends on lawful purpose, candidate consent and our provider arrangements. Pricing and turnaround are confirmed in your quotation.",
      "Screening results should inform, not automatically decide, a hiring outcome. Candidates can query and dispute a result.",
      "Credit checks are only coordinated for roles where the legal conditions for employment-related credit checks are met.",
      "We handle candidate information in line with POPIA and collect only what the requested checks need.",
    ],
    services: [
      { id: "sc-basic", name: "Basic Employment Screening", description: "Selected identity, qualification and employment checks, according to provider availability.", models: ["quote"] },
      { id: "sc-enhanced", name: "Enhanced Employment Screening", description: "Basic checks plus criminal-record check coordination and reference checks where appropriate.", models: ["quote"] },
      { id: "sc-financial", name: "Financial Responsibility Screening", description: "Credit-check coordination where the legal conditions are satisfied.", models: ["quote"] },
      { id: "sc-programme", name: "Corporate Screening Programme", description: "Bulk requests, consent administration, status dashboard, secure delivery and agreed service levels.", models: ["quote", "monthly"] },
      { id: "sc-individual", name: "Individual checks", description: "Qualification, employment history, identity, references, professional membership and directorship checks.", models: ["quote"] },
    ],
    extraFields: [
      {
        name: "checks",
        label: "Checks required",
        type: "checkboxes",
        options: ["Identity", "Qualifications", "Employment history", "Criminal record", "References", "Professional membership", "Directorships", "Credit (eligible roles only)"],
      },
      { name: "candidates", label: "Approximate number of candidates", type: "text" },
      { name: "purpose", label: "Role and lawful purpose for the checks", type: "textarea", required: true },
    ],
  },
  {
    slug: "ai-automation",
    navLabel: "Digital & AI Automation",
    title: "Digital & AI automation",
    tagline: "Reduce repetitive administration with the right digital tools.",
    intro:
      "WhatsApp enquiry handling, lead capture, reminders, document routing and reporting, built with secure credentials, error handling and human escalation.",
    href: "/solutions/ai-automation",
    fulfilment:
      "Built and managed by Resume Document Hub on n8n or another suitable automation platform.",
    notices: [
      "Starting prices exclude software subscriptions and message fees. Delivery and software costs are confirmed before work starts.",
      "Every workflow includes error handling, audit logs, consent controls and a way to hand over to a person.",
    ],
    services: [
      { id: "ai-basic", name: "Basic automation setup", description: "A simple automated task or notification.", models: ["once-off"], fromZar: 1500 },
      { id: "ai-faq", name: "FAQ or lead-capture workflow", description: "WhatsApp or web enquiry answers, lead capture and follow-ups.", models: ["once-off"], fromZar: 2500 },
      { id: "ai-integration", name: "Workflow integration", description: "Connecting compatible systems such as CRM, email and forms.", models: ["once-off"], fromZar: 3500 },
      { id: "ai-sales", name: "Sales or appointment automation", description: "Booking, reminders, quotations and invoice notifications.", models: ["once-off"], fromZar: 4500 },
      { id: "ai-hr", name: "HR or recruitment automation", description: "CV processing, candidate communication and onboarding workflows.", models: ["once-off"], fromZar: 5000 },
      { id: "ai-managed", name: "Managed automation", description: "We monitor, maintain and improve your workflows each month.", models: ["monthly", "quote"] },
    ],
  },
];

// Career Solutions: a separate funnel for individuals. Prices that already
// exist elsewhere on the platform come from the same source (payfast config)
// so the catalogue cannot contradict checkout.
export const CAREER_DIVISION: Division = {
  slug: "career-solutions",
  navLabel: "Career Solutions",
  title: "Career solutions",
  audience: "individual",
  tagline: "CVs, job applications and career guidance for individuals.",
  intro:
    "Professional documents, Auto Apply and interview preparation, plus premium human support when you want it.",
  href: "/careers",
  fulfilment:
    "CV, profile and consultation services are delivered by Resume Document Hub. Auto Apply, ATS scoring and interview practice are self-service tools on the platform.",
  notices: [
    "AI-generated scores, assessments and interview feedback are guidance, not guarantees of employment.",
    "Auto Apply only shows an application as submitted when the destination or authorised workflow confirms it.",
  ],
  services: [
    { id: "cs-cv", name: "CV and cover letter, done for you", description: "Professional CV writing or rewriting, ATS-friendly, with a cover letter.", models: ["once-off"], fromZar: WHATSAPP_ORDER_PRICING.cv_cover_letter },
    { id: "cs-linkedin", name: "LinkedIn profile optimisation", description: "A rewritten, search-ready LinkedIn profile.", models: ["once-off"], fromZar: WHATSAPP_ORDER_PRICING.linkedin_revamp },
    { id: "cs-exec-cv", name: "Executive CV and leadership profile", description: "A leadership-level CV and profile for senior roles.", models: ["once-off", "quote"] },
    { id: "cs-bio", name: "Professional biography", description: "Short and long biographies for websites, speaking and boards.", models: ["once-off", "quote"] },
    { id: "cs-portfolio", name: "Professional portfolio preparation", description: "Organising your work, qualifications and evidence into a portfolio.", models: ["once-off", "quote"] },
    { id: "cs-website", name: "Personal career website", description: "A personalised professional website with your summary, history, achievements, projects and downloadable CV, with privacy controls.", models: ["once-off", "quote"] },
    { id: "cs-pro", name: "Candidate Pro: Auto Apply and AI tools", description: "Job matching, tailored applications, application tracking and AI career tools.", models: ["monthly"], fromZar: SUBSCRIPTION_PACKAGES.find((p) => p.id === "candidate_pro")?.amountZar },
    { id: "cs-interview", name: "Interview preparation", description: "Job-specific interview questions and structured STAR feedback.", models: ["once-off"], fromZar: Math.min(...INTERVIEW_PACK_PACKAGES.map((p) => p.amountZar)) },
    { id: "cs-readiness", name: "Career readiness report and skills-gap assessment", description: "Guidance on where you stand and what to build next. Guidance only, not a guarantee.", models: ["once-off", "quote"] },
    { id: "cs-consult", name: "Career guidance consultation", description: "A one-on-one session with a human career consultant.", models: ["once-off", "quote"] },
  ],
};

export const ALL_DIVISIONS: Division[] = [CAREER_DIVISION, ...DIVISIONS];

export function getDivision(slug: string): Division | undefined {
  return ALL_DIVISIONS.find((d) => d.slug === slug);
}

export function availableServices(division: Division): CatalogService[] {
  return division.services.filter((s) => s.available !== false);
}

export function formatPrice(service: CatalogService): string {
  if (service.fromZar === undefined) return "Request a quote";
  const n = service.fromZar.toLocaleString("en-ZA");
  return service.models.includes("monthly") && !service.models.includes("once-off")
    ? `From R${n}/month`
    : `From R${n}`;
}
