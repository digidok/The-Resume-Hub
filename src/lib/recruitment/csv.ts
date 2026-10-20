// CSV parsing and mapping for talent-pool imports. Pure functions so they can be unit tested.

/** Parses CSV text (quotes, escaped quotes, commas and newlines inside quotes). */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const text = input.replace(/^﻿/, "");

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

export type TalentRow = {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  skills: string[];
  experience_years: number | null;
  availability: "immediate" | "within_month" | "later" | "unknown";
  consent_given: boolean;
};

const ALIASES: Record<string, keyof TalentRow | "first_name" | "last_name"> = {
  name: "full_name",
  "full name": "full_name",
  fullname: "full_name",
  full_name: "full_name",
  "first name": "first_name",
  firstname: "first_name",
  first_name: "first_name",
  surname: "last_name",
  "last name": "last_name",
  lastname: "last_name",
  last_name: "last_name",
  email: "email",
  "email address": "email",
  phone: "phone",
  cell: "phone",
  mobile: "phone",
  "phone number": "phone",
  location: "location",
  city: "location",
  town: "location",
  headline: "headline",
  title: "headline",
  "job title": "headline",
  position: "headline",
  skills: "skills",
  experience: "experience_years",
  "years experience": "experience_years",
  experience_years: "experience_years",
  availability: "availability",
  consent: "consent_given",
  consent_given: "consent_given",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normaliseAvailability(v: string): TalentRow["availability"] {
  const s = v.trim().toLowerCase();
  if (["immediate", "immediately", "now", "available"].includes(s)) return "immediate";
  if (["within_month", "1 month", "one month", "within a month", "30 days"].includes(s)) return "within_month";
  if (["later", "not available"].includes(s)) return "later";
  return "unknown";
}

export type ParsedImport = {
  rows: TalentRow[];
  skipped: { line: number; reason: string }[];
  missingColumns: string[];
};

/** Maps CSV rows (first row = headers) to talent-pool rows. Rows without a name or with a bad email are skipped. */
export function mapTalentCsv(table: string[][]): ParsedImport {
  if (table.length < 2) return { rows: [], skipped: [], missingColumns: ["a header row and at least one candidate"] };
  const headers = table[0].map((h) => ALIASES[h.trim().toLowerCase()]);
  const has = (k: string) => headers.includes(k as never);
  const missingColumns: string[] = [];
  if (!has("full_name") && !(has("first_name") && has("last_name"))) missingColumns.push("name (or first name and surname)");
  if (!has("email") && !has("phone")) missingColumns.push("email or phone");
  if (missingColumns.length) return { rows: [], skipped: [], missingColumns };

  const rows: TalentRow[] = [];
  const skipped: { line: number; reason: string }[] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((cells, idx) => {
    const line = idx + 2;
    const get = (key: string) => {
      const i = headers.indexOf(key as never);
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    };
    const full = get("full_name") || `${get("first_name")} ${get("last_name")}`.trim();
    if (!full) return void skipped.push({ line, reason: "no name" });

    const emailRaw = get("email").toLowerCase();
    if (emailRaw && !EMAIL_RE.test(emailRaw)) return void skipped.push({ line, reason: "invalid email" });
    if (emailRaw) {
      if (seen.has(emailRaw)) return void skipped.push({ line, reason: "duplicate email in file" });
      seen.add(emailRaw);
    }
    const phone = get("phone");
    if (!emailRaw && !phone) return void skipped.push({ line, reason: "no email or phone" });

    const exp = parseInt(get("experience_years"), 10);
    rows.push({
      full_name: full.slice(0, 160),
      email: emailRaw || null,
      phone: phone ? phone.slice(0, 40) : null,
      location: get("location").slice(0, 120) || null,
      headline: get("headline").slice(0, 200) || null,
      skills: get("skills")
        .split(/[;,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30),
      experience_years: Number.isFinite(exp) && exp >= 0 && exp <= 60 ? exp : null,
      availability: normaliseAvailability(get("availability")),
      consent_given: ["yes", "y", "true", "1", "given"].includes(get("consent_given").toLowerCase()),
    });
  });

  return { rows, skipped, missingColumns: [] };
}
