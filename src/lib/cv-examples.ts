import type { ResumeContent } from "@/types/database";

export type CvExample = {
  slug: string;
  name: string;
  role: string;
  industry: string;
  seniority: "Entry-level" | "Mid-career" | "Career changer";
  template: string;
  blurb: string;
  whyItWorks: string[];
  content: ResumeContent;
};

export const CV_EXAMPLES: CvExample[] = [
  {
    slug: "marketing-coordinator",
    name: "Thandiwe Nkosi",
    role: "Marketing Coordinator",
    industry: "Marketing & FMCG",
    seniority: "Mid-career",
    template: "professional",
    blurb:
      "4 years' experience running integrated campaigns for retail brands — a strong example for marketing, brand, and comms roles.",
    whyItWorks: [
      "Every bullet leads with a number — budget managed, follower growth, campaign lead time — not just a list of duties.",
      "The summary names the industry (FMCG/retail) and the specific skill set a recruiter is scanning for.",
      "Certifications (Google Ads, Meta Blueprint) back up the 'social media strategy' skill instead of just claiming it.",
    ],
    content: {
      full_name: "Thandiwe Nkosi",
      email: "thandiwe.nkosi@email.com",
      phone: "082 345 6789",
      location: "Johannesburg, Gauteng",
      summary:
        "Marketing coordinator with 4+ years driving integrated campaigns for FMCG and retail brands. Skilled in social media strategy, content calendars, and campaign reporting that turns spend into measurable growth.",
      experience: [
        {
          id: "exp-1",
          company: "BrightPath Retail Group",
          title: "Marketing Coordinator",
          location: "Johannesburg",
          start_date: "Feb 2022",
          current: true,
          description:
            "Managed a R1.2m annual marketing budget across 6 campaigns, delivering a 34% increase in footfall during peak trading periods.\nGrew Instagram following from 8,000 to 41,000 through a content calendar and influencer partnerships.\nCoordinated with 5 external agencies to launch a national back-to-school campaign 2 weeks ahead of schedule.",
        },
        {
          id: "exp-2",
          company: "Coastal Marketing Collective",
          title: "Marketing Assistant",
          location: "Durban",
          start_date: "Jan 2020",
          end_date: "Jan 2022",
          description:
            "Supported email marketing for 12 SME clients, lifting average open rates from 18% to 27%.\nBuilt weekly performance reports in Google Analytics and Meta Ads Manager for account managers.\nAssisted in the planning and on-site execution of 3 regional trade shows.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "University of Johannesburg",
          degree: "BCom",
          field: "Marketing Management",
          start_date: "2016",
          end_date: "2019",
        },
      ],
      skills: [
        "Social media strategy",
        "Meta & Google Ads",
        "Content calendars",
        "Campaign reporting",
        "Canva & Adobe Express",
        "CRM (HubSpot)",
        "Budget management",
        "Stakeholder coordination",
      ],
      languages: ["English", "Zulu", "Afrikaans"],
      projects: [],
      certifications: ["Google Ads Certification", "Meta Blueprint Certification"],
      awards: [],
    },
  },
  {
    slug: "retail-team-leader",
    name: "Sipho Dlamini",
    role: "Retail Team Leader",
    industry: "Retail & Customer Service",
    seniority: "Entry-level",
    template: "classic",
    blurb:
      "No degree, just proven results — a strong example for retail, hospitality, and customer-facing roles where reliability and numbers matter most.",
    whyItWorks: [
      "Shows career progression from Sales Assistant to Team Leader at the same company — a clean, easy-to-follow story.",
      "Quantifies 'soft' strengths like customer service (4.7/5 rating) and reliability (zero cash discrepancies over 3 years) instead of just stating them.",
      "No degree required — the National Senior Certificate is listed plainly, and the experience carries the CV.",
    ],
    content: {
      full_name: "Sipho Dlamini",
      email: "sipho.dlamini@email.com",
      phone: "071 234 5678",
      location: "Durban, KwaZulu-Natal",
      summary:
        "Reliable retail team leader with 5 years' experience supervising frontline staff, managing stock, and resolving customer complaints calmly under pressure. Consistently ranked in the top 3 stores for customer satisfaction scores.",
      experience: [
        {
          id: "exp-1",
          company: "Metro Retail Group",
          title: "Team Leader",
          location: "Durban",
          start_date: "Mar 2021",
          current: true,
          description:
            "Supervise a team of 14 sales assistants across 2 daily shifts, handling scheduling and performance check-ins.\nReduced stock discrepancies by 22% by introducing a weekly cycle-count routine.\nResolved an average of 30+ customer queries per week, maintaining a 4.7/5 satisfaction rating.\nTrained 9 new starters on POS systems and store procedures during onboarding.",
        },
        {
          id: "exp-2",
          company: "Metro Retail Group",
          title: "Sales Assistant",
          location: "Durban",
          start_date: "Jun 2018",
          end_date: "Feb 2021",
          description:
            "Consistently exceeded monthly sales targets by 10-15% through proactive upselling.\nMaintained shop floor merchandising standards in line with brand guidelines.\nHandled cash-up and till reconciliation with zero discrepancies over 3 years.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "Durban High School",
          degree: "National Senior Certificate",
          start_date: "2013",
          end_date: "2017",
        },
      ],
      skills: [
        "Team supervision",
        "Stock control",
        "POS systems",
        "Customer service",
        "Conflict resolution",
        "Scheduling",
        "Cash handling",
        "Onboarding & training",
      ],
      languages: ["English", "Zulu"],
      projects: [],
      certifications: ["First Aid Level 1 (Red Cross)"],
      awards: ["Employee of the Year 2023, Metro Retail Group"],
    },
  },
  {
    slug: "junior-software-developer",
    name: "Amahle Botha",
    role: "Junior Software Developer",
    industry: "Technology",
    seniority: "Entry-level",
    template: "minimal",
    blurb:
      "Bootcamp graduate with real shipped features and a personal project — a strong example for early-career tech applicants without years of industry experience.",
    whyItWorks: [
      "Leads with impact (users served, coverage raised, query time cut), not just a list of technologies.",
      "A personal project fills the experience gap and proves initiative beyond the day job.",
      "The skills list matches exactly what's demonstrated in the bullets above it — nothing is claimed that isn't backed up.",
    ],
    content: {
      full_name: "Amahle Botha",
      email: "amahle.botha@email.com",
      phone: "083 456 7890",
      location: "Cape Town, Western Cape",
      website: "github.com/amahlebotha",
      summary:
        "Junior full-stack developer with a strong grounding in JavaScript and Python from a bootcamp and self-driven projects. Comfortable working across the stack and picking up new frameworks quickly, with a focus on clean, testable code.",
      experience: [
        {
          id: "exp-1",
          company: "BrightWave Digital",
          title: "Junior Software Developer",
          location: "Cape Town",
          start_date: "Aug 2023",
          current: true,
          description:
            "Built and shipped 4 customer-facing features for a React/Node.js booking platform used by 3,000+ monthly users.\nWrote unit and integration tests that raised code coverage on the checkout module from 40% to 78%.\nPaired with senior engineers on a PostgreSQL migration that cut average query time by 35%.\nFixed 25+ bugs from the support backlog during the first 6 months.",
        },
        {
          id: "exp-2",
          company: "CapeTech Solutions",
          title: "Software Development Intern",
          location: "Cape Town",
          start_date: "Jan 2023",
          end_date: "Jul 2023",
          description:
            "Developed internal tooling in Python to automate weekly reporting, saving the team roughly 5 hours a week.\nContributed to a small React Native app used by 40 field staff.\nParticipated in daily stand-ups and sprint planning in an Agile team of 6.",
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "CodeSpace Academy",
          degree: "Full-Stack Web Development Bootcamp",
          start_date: "2022",
          end_date: "2022",
        },
        {
          id: "edu-2",
          school: "Cape Peninsula University of Technology",
          degree: "Diploma",
          field: "Information Technology",
          start_date: "2019",
          end_date: "2021",
        },
      ],
      skills: [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "Python",
        "PostgreSQL",
        "Git & GitHub",
        "REST APIs",
        "Jest",
      ],
      languages: ["English", "Afrikaans"],
      projects: [
        {
          id: "proj-1",
          name: "TaskFlow",
          description:
            "A personal task-management web app built with React, Node.js and PostgreSQL, deployed on Vercel with CI/CD via GitHub Actions.",
          url: "github.com/amahlebotha/taskflow",
        },
      ],
      certifications: [],
      awards: [],
    },
  },
];
