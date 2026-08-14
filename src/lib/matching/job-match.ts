import type { CareerProfile, Job, JobMatch } from "@/types/database";

function norm(value: string) {
  return value.trim().toLowerCase();
}

function overlap(a: string[], b: string[]): string[] {
  const bNorm = new Set(b.map(norm));
  return a.filter((item) => bNorm.has(norm(item)));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// Words too generic to count as a signal that a job title relates to a
// candidate's role/skills (e.g. matching on "senior" alone is meaningless).
const ROLE_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "for", "to", "in", "on", "at", "with", "is", "are",
  "new", "senior", "junior", "mid", "level", "role", "position", "job", "full", "part",
  "time", "remote", "hybrid", "urgent", "required", "wanted", "needed",
]);

function tokenize(text: string): string[] {
  return norm(text)
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length > 1 && !ROLE_STOP_WORDS.has(t));
}

const QUALIFICATION_KEYWORDS = [
  "degree", "diploma", "bachelor", "honours", "postgraduate", "btech", "b.tech",
  "matric", "nqf", "qualification", "certificate", "certified", "grade 12",
];

/**
 * Deterministic, explainable job-match scoring — every sub-score is
 * calculated from actual overlap between the candidate's Career Passport
 * and the job's stated requirements. No AI, no randomness, so the same
 * inputs always produce the same score and the same reasons.
 *
 * Externally-sourced listings (Adzuna/SerpApi) routinely have empty
 * `skills`, `qualification_requirements`, `industry`, and
 * `experience_min`/`max` fields — only `title` and `description` are
 * reliably populated. So each sub-score falls back to scanning
 * title+description text instead of silently defaulting to a perfect 100
 * whenever the structured field is missing, which used to manufacture
 * false 100% matches for completely unrelated roles.
 */
export function computeJobMatch(profile: CareerProfile, job: Job): JobMatch {
  const strengths: string[] = [];
  const gaps: string[] = [];

  // Experience
  let experienceScore = 100;
  const years = profile.years_experience;
  if (job.experience_min != null || job.experience_max != null) {
    if (years == null) {
      experienceScore = 50;
      gaps.push("Add your years of experience to your Career Passport for a more accurate match.");
    } else if (job.experience_min != null && years < job.experience_min) {
      experienceScore = clamp(Math.round((years / job.experience_min) * 90));
      gaps.push(
        `This role typically wants ${job.experience_min}+ years of experience — you have ${years}.`
      );
    } else {
      experienceScore = 100;
      strengths.push(
        `${years} years of experience meets the requirement${
          job.experience_min != null ? ` (${job.experience_min}+ years)` : ""
        }.`
      );
    }
  }

  // Skills
  let skillsScore = 100;
  if (job.skills.length > 0) {
    const matchedSkills = overlap(profile.skills, job.skills);
    skillsScore = clamp(Math.round((matchedSkills.length / job.skills.length) * 100));
    if (matchedSkills.length > 0) {
      strengths.push(`Skills match: ${matchedSkills.join(", ")}.`);
    }
    const missingSkills = job.skills.filter(
      (skill) => !matchedSkills.some((m) => norm(m) === norm(skill))
    );
    if (missingSkills.length > 0) {
      gaps.push(`Missing skills: ${missingSkills.slice(0, 4).join(", ")}.`);
    }
  } else {
    // No structured skills list — fall back to whether the candidate's own
    // skills actually show up in the job's title/description.
    const searchText = norm(`${job.title} ${job.description}`);
    if (profile.skills.length === 0) {
      skillsScore = 50;
      gaps.push("Add your skills to your Career Passport for a more accurate match.");
    } else {
      const matchedSkills = profile.skills.filter((s) => s.trim() && searchText.includes(norm(s)));
      if (matchedSkills.length > 0) {
        skillsScore = clamp(Math.round((matchedSkills.length / profile.skills.length) * 100));
        strengths.push(`Your listed skills appear in this job: ${matchedSkills.join(", ")}.`);
      } else {
        skillsScore = 20;
        gaps.push("None of your listed skills appear in this job's description or title.");
      }
    }
  }

  // Qualifications (qualifications + certifications vs stated requirement,
  // or — when no structured requirement exists — vs qualification keywords
  // found in the job description).
  let qualificationScore = 100;
  const impliesQualification =
    job.qualification_requirements != null ||
    QUALIFICATION_KEYWORDS.some((kw) => norm(job.description).includes(kw));
  if (impliesQualification) {
    const candidateQuals = [...profile.qualifications, ...profile.certifications];
    const requirementText = norm(job.qualification_requirements ?? job.description);
    const matched = candidateQuals.filter((q) => requirementText.includes(norm(q)));
    if (candidateQuals.length === 0) {
      qualificationScore = 35;
      gaps.push(
        job.qualification_requirements
          ? "Add your qualifications and certifications to your Career Passport."
          : "This role appears to require a formal qualification — none listed in your Career Passport."
      );
    } else if (matched.length > 0) {
      qualificationScore = 100;
      strengths.push(`Qualifications match: ${matched.join(", ")}.`);
    } else if (job.qualification_requirements) {
      qualificationScore = 40;
      gaps.push(`This role requires: ${job.qualification_requirements}.`);
    } else {
      qualificationScore = 55;
    }
  }

  // Industry
  let industryScore = 100;
  if (job.industry) {
    if (!profile.industry) {
      industryScore = 60;
    } else if (norm(profile.industry) === norm(job.industry)) {
      industryScore = 100;
      strengths.push(`${job.industry} industry experience.`);
    } else {
      industryScore = 40;
      gaps.push(`This role is in ${job.industry} — your profile lists ${profile.industry}.`);
    }
  }

  // Location
  let locationScore = 100;
  const jobLocationParts = [job.location, job.province].filter(Boolean).map((v) => norm(v!));
  if (profile.preferred_locations.length > 0 && jobLocationParts.length > 0) {
    const matches = profile.preferred_locations.some((loc) =>
      jobLocationParts.some((part) => part.includes(norm(loc)) || norm(loc).includes(part))
    );
    locationScore = matches ? 100 : 55;
    if (matches) {
      strengths.push(`Located in one of your preferred areas.`);
    } else {
      gaps.push(`This role is in ${job.location ?? job.province}, outside your preferred locations.`);
    }
  }

  // Role relevance — job.title is always populated, unlike the structured
  // fields above, so this check always runs. It catches the case none of
  // the per-field checks can: a role that's simply a different job to the
  // one the candidate does (e.g. an Administrator's profile against a
  // Developer posting), which otherwise sails through every empty
  // structured field with no signal to flag it.
  const jobTitleTokens = tokenize(job.title);
  const candidateRoleTokens = new Set(
    tokenize([profile.professional_title ?? "", ...profile.target_roles, ...profile.skills].join(" "))
  );
  const roleOverlap = jobTitleTokens.filter((t) => candidateRoleTokens.has(t));
  const roleMismatch = candidateRoleTokens.size > 0 && jobTitleTokens.length > 0 && roleOverlap.length === 0;
  if (roleMismatch) {
    gaps.unshift(
      `Your Career Passport doesn't show experience related to "${job.title}" — double-check this role is the right fit before applying.`
    );
  }

  let overallScore = Math.round(
    experienceScore * 0.25 +
      skillsScore * 0.3 +
      qualificationScore * 0.15 +
      industryScore * 0.15 +
      locationScore * 0.15
  );
  if (roleMismatch) {
    overallScore = Math.min(overallScore, 45);
  }

  let recommendation: string;
  if (overallScore >= 85) {
    recommendation = "Strong candidate. You meet most requirements — go ahead and apply.";
  } else if (overallScore >= 70) {
    recommendation =
      gaps.length > 0
        ? `Good match. Consider addressing this before applying: ${gaps[0]}`
        : "Good match. This role fits your profile well.";
  } else if (overallScore >= 50) {
    recommendation = "Possible match, but there are some gaps worth addressing before you apply.";
  } else {
    recommendation =
      "This role may be a stretch based on your current profile — consider tailoring your CV or looking for closer matches.";
  }

  return {
    jobId: job.id,
    overallScore: clamp(overallScore),
    experienceScore: clamp(experienceScore),
    skillsScore: clamp(skillsScore),
    qualificationScore: clamp(qualificationScore),
    industryScore: clamp(industryScore),
    locationScore: clamp(locationScore),
    strengths,
    gaps,
    recommendation,
  };
}
