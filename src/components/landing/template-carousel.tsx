"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResumePreview } from "@/components/resume/resume-preview";
import { Button } from "@/components/ui/button";
import type { ResumeContent } from "@/types/database";

/**
 * Each featured template gets its own fully filled-in sample profile —
 * different name, role, and history per card — rather than one repeated
 * person across every preview. Every profile carries enough real content
 * (3 roles, several bullets each, a full skills/education/certifications
 * set) to fill a genuine one-page CV — a half-empty preview undersells a
 * template far more than a thin one ever would.
 */
const FEATURED_TEMPLATES: { id: string; content: ResumeContent }[] = [
  {
    id: "professional",
    content: {
      full_name: "Thandiwe Mokoena",
      email: "thandiwe.mokoena@email.com",
      phone: "082 555 0134",
      location: "Sandton, Johannesburg",
      summary:
        "Results-driven marketing manager with 8+ years leading brand strategy and digital campaigns for consumer and B2B brands across South Africa. Skilled at turning market insight into measurable revenue growth.",
      experience: [
        {
          id: "exp-1",
          company: "Northwind Retail Group",
          title: "Senior Marketing Manager",
          location: "Johannesburg",
          start_date: "2021",
          current: true,
          description:
            "Lead a team of 6 driving brand strategy and digital campaigns, growing online revenue 42% year over year.\nLaunched 3 new product lines nationally, each hitting first-year sales targets.\nOwn a R25M annual marketing budget across paid media, CRM, and retail activation.",
        },
        {
          id: "exp-2",
          company: "Baobab Consumer Brands",
          title: "Marketing Manager",
          location: "Cape Town",
          start_date: "2018",
          end_date: "2021",
          description:
            "Managed a R12M annual marketing budget across TV, digital, and retail activation.\nRebuilt the CRM programme, lifting repeat-purchase rate by 19%.",
        },
        {
          id: "exp-3",
          company: "Cape Media Agency",
          title: "Marketing Coordinator",
          location: "Cape Town",
          start_date: "2015",
          end_date: "2018",
          description:
            "Coordinated campaign delivery for 8 concurrent client accounts.\nProduced weekly performance reporting that became the agency's standard template.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "University of the Witwatersrand",
          degree: "BCom",
          field: "Marketing",
          start_date: "2012",
          end_date: "2015",
        },
      ],
      skills: [
        "Brand Strategy",
        "Digital Marketing",
        "Team Leadership",
        "Budget Management",
        "Campaign Analytics",
        "CRM Strategy",
        "Stakeholder Management",
      ],
      languages: ["English", "Zulu", "Afrikaans"],
      projects: [],
      certifications: ["Google Analytics Certified", "Meta Certified Digital Marketing Associate"],
      awards: ["Marketer of the Year — Northwind Retail Group, 2023"],
    },
  },
  {
    id: "sidebar-professional",
    content: {
      full_name: "Sipho Dlamini",
      email: "sipho.dlamini@email.com",
      phone: "071 442 8890",
      location: "Cape Town",
      summary:
        "Backend-leaning full-stack engineer with 6 years building payments and logistics platforms at scale for South African fintechs. Focused on reliability, clean APIs, and mentoring junior engineers.",
      experience: [
        {
          id: "exp-1",
          company: "Fynbos Pay",
          title: "Senior Software Engineer",
          location: "Cape Town",
          start_date: "2020",
          current: true,
          description:
            "Rebuilt the core ledger service handling 2M+ transactions a month, cutting p99 latency by 60%.\nMentored 3 junior engineers through their first production releases.\nDesigned the on-call runbook now used across all backend teams.",
        },
        {
          id: "exp-2",
          company: "Karoo Logistics",
          title: "Software Engineer",
          location: "Johannesburg",
          start_date: "2017",
          end_date: "2020",
          description:
            "Built the route-optimisation API powering same-day delivery for 40+ retail partners.\nMigrated the monolith's dispatch module to a standalone service, cutting deploy time from 40 to 6 minutes.",
        },
        {
          id: "exp-3",
          company: "Two Oceans Software",
          title: "Junior Developer",
          location: "Cape Town",
          start_date: "2016",
          end_date: "2017",
          description: "Built internal tooling for the QA team, cutting manual regression testing time by half.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "University of Cape Town",
          degree: "BSc",
          field: "Computer Science",
          start_date: "2013",
          end_date: "2016",
        },
      ],
      skills: [
        "TypeScript",
        "Node.js",
        "PostgreSQL",
        "AWS",
        "System Design",
        "Docker",
        "CI/CD",
      ],
      languages: ["English", "Zulu"],
      projects: [
        {
          id: "proj-1",
          name: "Open-source rate limiter (Node.js)",
          url: "github.com/sdlamini/ratelimit",
          description: "A distributed rate-limiting library used by 3 fintech startups in production.",
        },
      ],
      certifications: ["AWS Certified Solutions Architect"],
      awards: [],
    },
  },
  {
    id: "modern",
    content: {
      full_name: "Amara Okafor",
      email: "amara.okafor@email.com",
      phone: "081 220 6634",
      location: "Lagos, Nigeria",
      summary:
        "Sales team lead with 5+ years closing enterprise SaaS deals across West Africa, consistently exceeding quota by 20%+. Builds repeatable playbooks, not one-off wins.",
      experience: [
        {
          id: "exp-1",
          company: "Savannah Cloud Solutions",
          title: "Sales Team Lead",
          location: "Lagos",
          start_date: "2022",
          current: true,
          description:
            "Lead a team of 4 account executives to 135% of annual quota in 2024.\nBuilt the outbound playbook now used company-wide.\nPartnered with product on 2 features that shortened the average sales cycle by 3 weeks.",
        },
        {
          id: "exp-2",
          company: "Delta Business Systems",
          title: "Account Executive",
          location: "Lagos",
          start_date: "2019",
          end_date: "2022",
          description:
            "Closed R8M+ in new business across 60+ mid-market accounts.\nRanked #2 nationally on the sales leaderboard for 2021.",
        },
        {
          id: "exp-3",
          company: "Naija Retail Tech",
          title: "Sales Development Representative",
          location: "Lagos",
          start_date: "2018",
          end_date: "2019",
          description: "Booked 400+ qualified meetings in a single year, the highest volume on the team.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "University of Lagos",
          degree: "BSc",
          field: "Business Administration",
          start_date: "2014",
          end_date: "2018",
        },
      ],
      skills: [
        "Enterprise Sales",
        "Negotiation",
        "CRM (Salesforce)",
        "Pipeline Management",
        "Team Leadership",
        "Sales Coaching",
      ],
      languages: ["English", "Yoruba"],
      projects: [],
      certifications: ["Salesforce Certified Sales Cloud Consultant"],
      awards: ["President's Club 2023", "Rookie of the Year 2019"],
    },
  },
  {
    id: "executive-portfolio",
    content: {
      full_name: "Lindiwe Zulu",
      email: "lindiwe.zulu@email.com",
      phone: "083 771 4420",
      location: "Sandton, Johannesburg",
      summary:
        "Finance director with 12+ years driving profitability and governance across manufacturing and retail groups. Trusted by boards for clean, defensible numbers and calm crisis leadership.",
      experience: [
        {
          id: "exp-1",
          company: "Highveld Manufacturing Group",
          title: "Finance Director",
          location: "Johannesburg",
          start_date: "2019",
          current: true,
          description:
            "Cut operating costs 18% through a group-wide finance transformation programme.\nLed the finance workstream on a R400M acquisition, completed 6 weeks ahead of schedule.\nBuilt out a 14-person finance function, including the group's first internal audit team.",
        },
        {
          id: "exp-2",
          company: "Protea Retail Holdings",
          title: "Financial Manager",
          location: "Pretoria",
          start_date: "2014",
          end_date: "2019",
          description:
            "Managed a R1.2B annual budget across 90 stores and led a team of 12.\nImplemented a new ERP rollout across all regions on time and under budget.",
        },
        {
          id: "exp-3",
          company: "Sasol Group",
          title: "Financial Accountant",
          location: "Johannesburg",
          start_date: "2011",
          end_date: "2014",
          description: "Managed month-end close for a R2B business unit, reducing close time from 10 to 5 days.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "University of Pretoria",
          degree: "BCom Honours",
          field: "Accounting Sciences",
          start_date: "2007",
          end_date: "2011",
        },
      ],
      skills: [
        "Financial Strategy",
        "M&A",
        "Corporate Governance",
        "Risk Management",
        "Team Leadership",
        "ERP Implementation",
        "Board Reporting",
      ],
      languages: ["English", "Zulu", "Afrikaans"],
      projects: [],
      certifications: ["CA(SA)"],
      awards: ["CFO Rising Star Award, 2021"],
    },
  },
  {
    id: "bold-coral",
    content: {
      full_name: "Zanele Khumalo",
      email: "zanele.khumalo@email.com",
      phone: "079 330 1187",
      location: "Durban",
      summary:
        "Brand and digital designer with 5 years shaping visual identity for hospitality and lifestyle brands across KwaZulu-Natal. Equally comfortable leading a rebrand or shipping a campaign asset by end of day.",
      experience: [
        {
          id: "exp-1",
          company: "Coastal Creative Studio",
          title: "Senior Graphic Designer",
          location: "Durban",
          start_date: "2021",
          current: true,
          description:
            "Led rebrand for 6 hospitality clients, growing average social engagement 3x.\nManaged a team of 2 junior designers.\nBuilt the studio's first reusable brand-system templates, cutting turnaround time by 30%.",
        },
        {
          id: "exp-2",
          company: "Umhlanga Design House",
          title: "Graphic Designer",
          location: "Umhlanga",
          start_date: "2019",
          end_date: "2021",
          description:
            "Designed print and digital campaigns for 20+ SME clients.\nProduced the visual identity for a boutique hotel chain's 5-property relaunch.",
        },
        {
          id: "exp-3",
          company: "Freelance",
          title: "Freelance Designer",
          location: "Durban",
          start_date: "2018",
          end_date: "2019",
          description: "Delivered branding and social content for 15+ small businesses across KwaZulu-Natal.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "Durban University of Technology",
          degree: "National Diploma",
          field: "Graphic Design",
          start_date: "2016",
          end_date: "2018",
        },
      ],
      skills: [
        "Adobe Creative Suite",
        "Brand Identity",
        "Figma",
        "Art Direction",
        "Motion Graphics",
        "Typography",
      ],
      languages: ["English", "Zulu"],
      projects: [
        {
          id: "proj-1",
          name: "uMhlanga Food Festival — Brand Identity",
          description: "Full visual identity and signage system for a 20,000-attendee annual festival.",
        },
      ],
      certifications: ["Adobe Certified Professional"],
      awards: ["Loerie Awards — Bronze, Student Category 2018"],
    },
  },
  {
    id: "sidebar-charcoal",
    content: {
      full_name: "Farai Chikafu",
      email: "farai.chikafu@email.com",
      phone: "084 556 2291",
      location: "Cape Town",
      summary:
        "Operations manager with 7 years streamlining warehousing and fulfilment for fast-growing e-commerce brands. Builds processes that hold up under Black Friday volume.",
      experience: [
        {
          id: "exp-1",
          company: "Table Mountain Logistics",
          title: "Operations Manager",
          location: "Cape Town",
          start_date: "2020",
          current: true,
          description:
            "Reduced order-fulfilment time from 48 to 18 hours across 3 warehouses.\nManaged a team of 35 across two shifts.\nRolled out a new WMS that cut picking errors by 40%.",
        },
        {
          id: "exp-2",
          company: "Atlantic Freight Co.",
          title: "Warehouse Supervisor",
          location: "Cape Town",
          start_date: "2016",
          end_date: "2020",
          description:
            "Supervised daily operations for a 15,000m² distribution centre.\nLed the site through 2 consecutive zero-incident safety audits.",
        },
        {
          id: "exp-3",
          company: "Boland Distribution",
          title: "Warehouse Team Leader",
          location: "Stellenbosch",
          start_date: "2014",
          end_date: "2016",
          description: "Supervised a 12-person shift, consistently hitting 98%+ order-accuracy targets.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "Cape Peninsula University of Technology",
          degree: "National Diploma",
          field: "Logistics Management",
          start_date: "2013",
          end_date: "2015",
        },
      ],
      skills: [
        "Supply Chain Management",
        "Inventory Control",
        "Team Leadership",
        "Lean Operations",
        "SAP",
        "Health & Safety Compliance",
      ],
      languages: ["English", "Shona", "Xhosa"],
      projects: [],
      certifications: ["Six Sigma Green Belt", "SAP Warehouse Management"],
      awards: [],
    },
  },
  {
    id: "classic-photo",
    content: {
      full_name: "Naledi Sithole",
      email: "naledi.sithole@email.com",
      phone: "072 118 5563",
      location: "Pretoria",
      summary:
        "Registered nurse with 6 years' experience in critical care, committed to patient-centred, evidence-based care and calm under pressure in high-acuity settings.",
      experience: [
        {
          id: "exp-1",
          company: "Steve Biko Academic Hospital",
          title: "Registered Nurse — ICU",
          location: "Pretoria",
          start_date: "2020",
          current: true,
          description:
            "Provide critical care to a 12-bed ICU, coordinating with multidisciplinary teams on complex cases.\nPrecept 2–3 new graduate nurses per intake, all retained past their first year.",
        },
        {
          id: "exp-2",
          company: "Netcare Jakaranda Hospital",
          title: "Staff Nurse",
          location: "Pretoria",
          start_date: "2018",
          end_date: "2020",
          description:
            "Rotated across surgical and general wards, mentoring student nurses.\nCo-led a ward hand-hygiene initiative that cut infection rates by 22%.",
        },
        {
          id: "exp-3",
          company: "Kalafong Provincial Tertiary Hospital",
          title: "Student Nurse (Clinical Placement)",
          location: "Pretoria",
          start_date: "2016",
          end_date: "2018",
          description: "Completed clinical rotations across medical, surgical, and maternity wards.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "University of Pretoria",
          degree: "BCur",
          field: "Nursing Science",
          start_date: "2014",
          end_date: "2017",
        },
      ],
      skills: [
        "Critical Care",
        "Patient Assessment",
        "SANC Registered",
        "Electronic Health Records",
        "Clinical Mentoring",
      ],
      languages: ["English", "Sepedi", "Afrikaans"],
      projects: [],
      certifications: ["Advanced Cardiac Life Support (ACLS)", "Basic Life Support (BLS)"],
      awards: ["Nurse of the Quarter — Steve Biko Academic Hospital, Q3 2023"],
    },
  },
  {
    id: "minimal",
    content: {
      full_name: "Tumi Radebe",
      email: "tumi.radebe@email.com",
      phone: "076 904 2217",
      location: "Johannesburg",
      summary:
        "Organised office administrator with 4 years supporting executive teams and streamlining day-to-day operations across busy, fast-paced offices.",
      experience: [
        {
          id: "exp-1",
          company: "Rosebank Legal Partners",
          title: "Office Administrator",
          location: "Johannesburg",
          start_date: "2021",
          current: true,
          description:
            "Manage diaries for 4 partners, vendor contracts, and onboarding for new staff.\nCoordinated the office's move to a new building with zero disruption to client meetings.",
        },
        {
          id: "exp-2",
          company: "Melrose Consulting",
          title: "Receptionist / Admin Assistant",
          location: "Johannesburg",
          start_date: "2019",
          end_date: "2021",
          description:
            "Handled front-desk operations and travel bookings for a 30-person office.\nMaintained the filing and records system through a full ISO audit with zero findings.",
        },
        {
          id: "exp-3",
          company: "Sandton Business Centre",
          title: "Administrative Intern",
          location: "Sandton",
          start_date: "2018",
          end_date: "2019",
          description: "Supported invoicing and client onboarding for a shared-office space serving 40+ tenants.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "Rosebank College",
          degree: "Diploma",
          field: "Office Administration",
          start_date: "2017",
          end_date: "2018",
        },
      ],
      skills: [
        "Microsoft Office",
        "Diary Management",
        "Vendor Coordination",
        "Onboarding",
        "Records Management",
      ],
      languages: ["English", "Sesotho"],
      projects: [],
      certifications: ["Microsoft Office Specialist"],
      awards: [],
    },
  },
  {
    id: "sidebar-achiever",
    content: {
      full_name: "Kagiso Ndlovu",
      email: "kagiso.ndlovu@email.com",
      phone: "082 604 7719",
      location: "Sandton, Johannesburg",
      summary:
        "Business founder with 8+ years driving growth through market analysis, innovation, and team leadership — founded and scaled a startup to R18M in its first year, securing R9M in seed funding.",
      experience: [
        {
          id: "exp-1",
          company: "Ubuntu Ventures",
          title: "Business Founder",
          location: "Johannesburg",
          start_date: "2020",
          current: true,
          description:
            "Founded and scaled a tech startup to R18M revenue in its first year, securing R9M in seed funding.\nBuilt a cross-functional team of 15, cultivating a culture of innovation.\nDeveloped a market-penetration strategy that grew market share 25% within two years.",
        },
        {
          id: "exp-2",
          company: "Highland Ventures Group",
          title: "Director of Business Development",
          location: "Johannesburg",
          start_date: "2016",
          end_date: "2020",
          description:
            "Identified and closed 25 strategic partnerships, generating an additional R22M in annual revenue.\nMentored a team of 4, with 2 promoted into senior roles within a year.",
        },
        {
          id: "exp-3",
          company: "Rand Merchant Ventures",
          title: "Product Manager",
          location: "Johannesburg",
          start_date: "2013",
          end_date: "2016",
          description:
            "Managed product lifecycle from concept to launch, delivering tech products that collectively generated R15M in sales within their first year.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "University of the Witwatersrand",
          degree: "MBA",
          field: "",
          start_date: "2013",
          end_date: "2015",
        },
      ],
      skills: [
        "Business Development",
        "Market Analysis",
        "Financial Planning",
        "Strategic Marketing",
        "Team Leadership",
        "Fundraising",
      ],
      languages: ["English", "Setswana"],
      projects: [],
      certifications: ["Entrepreneurship Specialization (Wharton)", "Data-Driven Decision Making (Wharton)"],
      awards: ["40 Under 40 — South African Business, 2023"],
    },
  },
];

const CARD_WIDTH = 300;
const PREVIEW_NATIVAL_WIDTH = 816; // 8.5in at 96dpi, matches ResumePreview's max-w-[8.5in]
const SCALE = CARD_WIDTH / PREVIEW_NATIVAL_WIDTH;

const AUTO_ADVANCE_MS = 4000;

export function TemplateCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion.current) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % FEATURED_TEMPLATES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  function go(delta: number) {
    setActive((i) => (i + delta + FEATURED_TEMPLATES.length) % FEATURED_TEMPLATES.length);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex gap-5 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(calc(50% - ${CARD_WIDTH / 2}px - ${active * (CARD_WIDTH + 20)}px))` }}
        >
          {FEATURED_TEMPLATES.map(({ id: templateId, content }, i) => (
            <button
              key={templateId}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-xl border bg-white text-left shadow-sm transition-all duration-300 ${
                i === active
                  ? "scale-105 border-brand-400 shadow-lg shadow-brand-900/10"
                  : "scale-95 border-slate-200 opacity-60 hover:opacity-90"
              }`}
              style={{ width: CARD_WIDTH }}
            >
              <div
                className="overflow-hidden rounded-t-xl border-b border-slate-100 bg-slate-50"
                style={{ width: CARD_WIDTH, height: CARD_WIDTH * 1.29 }}
              >
                <div
                  style={{
                    width: PREVIEW_NATIVAL_WIDTH,
                    transform: `scale(${SCALE})`,
                    transformOrigin: "top left",
                  }}
                >
                  <ResumePreview content={content} template={templateId} />
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {templateId
                    .split("-")
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" ")}
                </p>
                <p className="truncate text-xs text-slate-500">{content.full_name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous template"
        className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:text-brand-700 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next template"
        className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:text-brand-700 sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Link href="/signup">
          <Button>Use this template</Button>
        </Link>
        <Link href="/signup" className="text-sm font-medium text-brand-700 hover:underline">
          Show all 100+ templates →
        </Link>
      </div>
    </div>
  );
}
