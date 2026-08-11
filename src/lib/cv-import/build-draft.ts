import { normalizeEmail, normalizeLinkedin, normalizePhone } from "./normalize";
import type { CvConfidenceScores, CvExtractionResult, CvImportDraft } from "./types";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function computeConfidence(
  parsed: CvExtractionResult,
  email: { valid: boolean },
  phone: { valid: boolean }
): CvConfidenceScores {
  let contact = 100;
  if (!parsed.email) contact -= 30;
  else if (!email.valid) contact -= 20;
  if (!parsed.phone) contact -= 20;
  else if (!phone.valid) contact -= 15;
  if (!parsed.location) contact -= 10;

  let experience = parsed.experience.length === 0 ? 40 : 100;
  if (parsed.experience.length > 0) {
    const missingDates = parsed.experience.filter((e) => !e.current && !e.end_date && !e.start_date).length;
    experience -= Math.min(50, missingDates * 15);
  }

  const education = parsed.education.some((e) => e.school) ? 90 : 50;

  const skills = parsed.skills.length >= 3 ? 90 : parsed.skills.length >= 1 ? 70 : 40;

  return {
    contact_info: clamp(contact),
    work_experience: clamp(experience),
    education: clamp(education),
    skills: clamp(skills),
  };
}

export function buildDraftFromExtraction(
  parsed: CvExtractionResult,
  sourceFiles: CvImportDraft["sourceFiles"],
  options: { warning?: string; hasProfilePhoto?: boolean } = {}
): CvImportDraft {
  const { warning, hasProfilePhoto = false } = options;
  const email = normalizeEmail(parsed.email);
  const phone = normalizePhone(parsed.phone, parsed.location);
  const linkedinUrl = /linkedin\.com/i.test(parsed.website ?? "") ? normalizeLinkedin(parsed.website) : "";

  const lowConfidenceFields: string[] = [];
  if (parsed.email && !email.valid) lowConfidenceFields.push("Email address");
  if (parsed.phone && !phone.valid) lowConfidenceFields.push("Phone number");
  if (!parsed.full_name) lowConfidenceFields.push("Full name");

  parsed.experience.forEach((exp) => {
    if (!exp.current && !exp.end_date) {
      lowConfidenceFields.push(`End date for ${exp.company || "a role"}`);
    }
  });

  const content: CvImportDraft["content"] = {
    full_name: parsed.full_name ?? "",
    email: email.value,
    phone: phone.value,
    location: parsed.location ?? "",
    website: parsed.website ?? "",
    summary: parsed.summary ?? "",
    experience: parsed.experience.map((exp) => ({
      id: crypto.randomUUID(),
      company: exp.company ?? "",
      title: exp.title ?? "",
      location: exp.location,
      start_date: exp.start_date,
      end_date: exp.end_date,
      current: exp.current,
      description: exp.description,
    })),
    education: parsed.education.map((edu) => ({
      id: crypto.randomUUID(),
      school: edu.school ?? "",
      degree: edu.degree,
      field: edu.field,
      start_date: edu.start_date,
      end_date: edu.end_date,
    })),
    skills: parsed.skills ?? [],
    languages: parsed.languages ?? [],
    projects: (parsed.projects ?? []).map((p) => ({
      id: crypto.randomUUID(),
      name: p.name ?? "",
      description: p.description,
      url: p.url,
    })),
  };

  const mostRecentTitle =
    parsed.experience.find((e) => e.current)?.title || parsed.experience[0]?.title || "";

  return {
    content,
    careerExtras: {
      professionalTitle: mostRecentTitle,
      certifications: parsed.certifications ?? [],
      linkedinUrl,
    },
    confidence: computeConfidence(parsed, email, phone),
    lowConfidenceFields: Array.from(new Set(lowConfidenceFields)),
    hasProfilePhoto,
    sourceFiles,
    warning,
  };
}
