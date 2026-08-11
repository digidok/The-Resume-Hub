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

/**
 * Deterministic, explainable job-match scoring — every sub-score is
 * calculated from actual overlap between the candidate's Career Passport
 * and the job's stated requirements. No AI, no randomness, so the same
 * inputs always produce the same score and the same reasons.
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
  }

  // Qualifications (qualifications + certifications vs free-text requirement)
  let qualificationScore = 100;
  if (job.qualification_requirements) {
    const candidateQuals = [...profile.qualifications, ...profile.certifications];
    const requirementText = norm(job.qualification_requirements);
    const matched = candidateQuals.filter((q) => requirementText.includes(norm(q)));
    if (candidateQuals.length === 0) {
      qualificationScore = 40;
      gaps.push("Add your qualifications and certifications to your Career Passport.");
    } else if (matched.length > 0) {
      qualificationScore = 100;
      strengths.push(`Qualifications match: ${matched.join(", ")}.`);
    } else {
      qualificationScore = 40;
      gaps.push(`This role requires: ${job.qualification_requirements}.`);
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

  const overallScore = Math.round(
    experienceScore * 0.25 +
      skillsScore * 0.3 +
      qualificationScore * 0.15 +
      industryScore * 0.15 +
      locationScore * 0.15
  );

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
