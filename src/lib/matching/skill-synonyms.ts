/**
 * Groups of terms that mean the same thing on a South African CV/job posting
 * even though they're spelled differently — e.g. a candidate who lists
 * "Talent Acquisition" should still match a job asking for "Recruitment".
 * Used by job-match.ts (skill overlap scoring) and by extractSkillsFromText
 * below (populating jobs.skills at sync time) so both paths recognise the
 * same set of equivalences.
 */
export const SKILL_SYNONYM_GROUPS: string[][] = [
  ["human resources", "hr", "human resource management"],
  ["recruitment", "recruiting", "talent acquisition", "talent sourcing", "candidate acquisition", "headhunting"],
  ["accounting", "accountant", "bookkeeping", "financial accounting"],
  ["sales", "business development", "sales development", "sales representative"],
  ["customer service", "client service", "customer support", "client support"],
  ["information technology", "ict"],
  ["software development", "software engineering", "software developer", "software engineer", "programming"],
  ["project management", "project manager"],
  ["administration", "admin", "office administration", "administrative"],
  ["marketing", "digital marketing", "marketing communications"],
  ["finance", "financial", "financial management"],
  ["mining", "mining engineering", "mine engineering"],
  ["construction", "civil engineering", "building construction"],
  ["nursing", "nurse", "professional nurse", "staff nurse", "patient care"],
  ["logistics", "supply chain", "supply chain management"],
  ["warehouse", "stock control", "inventory management", "inventory control"],
  ["retail", "till operation", "cashier", "till packing"],
  ["driving", "driver", "delivery driver", "courier"],
  ["security", "security guard", "security officer"],
  ["teaching", "education", "tutoring", "teacher"],
  ["legal", "paralegal", "legal assistant"],
  ["electrical", "electrician", "electrical engineering"],
  ["mechanical", "millwright", "mechanical engineering", "fitter"],
  ["call centre", "call center", "contact centre", "contact center"],
  ["data analysis", "data analyst", "data analytics"],
  ["excel", "microsoft excel", "spreadsheets", "ms excel"],
  ["communication", "communications", "communication skills"],
  ["procurement", "purchasing", "supply management"],
  ["operations", "operations management"],
  ["engineering", "engineer"],
  ["payroll", "payroll administration"],
  ["labour relations", "employee relations", "industrial relations"],
  ["health and safety", "occupational health and safety", "ohs"],
];

function norm(value: string) {
  return value.trim().toLowerCase();
}

const SYNONYM_LOOKUP = new Map<string, number>();
SKILL_SYNONYM_GROUPS.forEach((group, index) => {
  for (const term of group) SYNONYM_LOOKUP.set(term, index);
});

/** Two skill strings are the same skill if they're equal once normalised, or
 * both belong to the same synonym group above. */
export function sameSkill(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;
  const groupA = SYNONYM_LOOKUP.get(na);
  const groupB = SYNONYM_LOOKUP.get(nb);
  return groupA !== undefined && groupA === groupB;
}

/** Whether `skill` (or one of its synonyms) appears in `haystack` — haystack
 * must already be lowercased. */
export function skillAppearsIn(skill: string, haystack: string): boolean {
  const ns = norm(skill);
  if (haystack.includes(ns)) return true;
  const group = SYNONYM_LOOKUP.get(ns);
  if (group === undefined) return false;
  return SKILL_SYNONYM_GROUPS[group].some((term) => haystack.includes(term));
}

/**
 * A broader, display-cased keyword list used only to populate `jobs.skills`
 * from a listing's title/description at sync time — deliberately wider than
 * the synonym groups above (which exist to link equivalent terms, not to
 * enumerate every skill worth detecting).
 */
const SKILL_KEYWORDS = [
  "Human Resources", "Recruitment", "Talent Acquisition", "Accounting", "Bookkeeping",
  "Sales", "Business Development", "Customer Service", "Information Technology",
  "Software Development", "Project Management", "Administration", "Marketing",
  "Digital Marketing", "Finance", "Mining", "Construction", "Civil Engineering",
  "Nursing", "Patient Care", "Logistics", "Supply Chain", "Warehouse", "Retail",
  "Driving", "Security", "Teaching", "Legal", "Electrical", "Mechanical",
  "Call Centre", "Data Analysis", "Excel", "Communication", "Procurement",
  "Operations", "Engineering", "SQL", "Python", "JavaScript", "Java", "SAP",
  "AutoCAD", "Forklift", "Microsoft Office", "Payroll", "Labour Relations",
  "Health and Safety", "Quality Control", "Negotiation", "Leadership",
  "Team Management", "Budgeting", "Financial Reporting", "Compliance",
  "Risk Management", "Auditing", "Taxation", "Welding", "Plumbing",
  "Carpentry", "First Aid", "Bricklaying", "Boilermaking", "Nursing Care",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SKILL_PATTERNS = SKILL_KEYWORDS.map(
  (skill) => [skill, new RegExp(`(^|[^a-z0-9])${escapeRegExp(norm(skill))}([^a-z0-9]|$)`)] as const
);

/** Scans a job's title + description for known skill keywords, for storage
 * on jobs.skills at sync time — so matching doesn't have to fall back to a
 * live text scan for every candidate on every request. Capped so a single
 * long description can't produce an unbounded skills array. */
export function extractSkillsFromText(title: string, description: string): string[] {
  const haystack = norm(`${title} ${description}`);
  const found: string[] = [];
  for (const [skill, pattern] of SKILL_PATTERNS) {
    if (pattern.test(haystack)) found.push(skill);
    if (found.length >= 12) break;
  }
  return found;
}
