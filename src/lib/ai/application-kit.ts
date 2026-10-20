import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeJobMatch } from "@/lib/matching/job-match";
import { randomSuffix } from "@/lib/slug";
import { logAiUsage } from "@/lib/ai/usage";
import type { CareerProfile, Job, ResumeContent } from "@/types/database";

const KIT_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string" as const },
    skills: { type: "array" as const, items: { type: "string" as const } },
    experience_descriptions: { type: "array" as const, items: { type: "string" as const } },
    cover_letter: { type: "string" as const },
  },
  required: ["summary", "skills", "experience_descriptions", "cover_letter"],
  additionalProperties: false,
};

function norm(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Prepares a tailored resume + cover letter for one job on behalf of a
 * candidate, outside a signed-in request (the scheduled Auto-Apply run).
 * It NEVER submits anything: it only saves the documents and an
 * ai_generations row. The candidate reviews them and applies themselves.
 * Requires a service-role client.
 */
export async function prepareApplicationKit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  params: { userId: string; resumeId: string; job: Job; careerProfile: CareerProfile | null }
): Promise<{ ok: true; generationId: string } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not configured." };

  const { userId, resumeId, job, careerProfile } = params;

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, title, template, content")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!resume) return { ok: false, error: "Resume not found." };

  const content = resume.content as ResumeContent;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const prompt = `You are helping a candidate tailor their resume and write a cover letter for a specific job. Use ONLY facts already present in their resume — never invent experience, skills, employers, dates, or achievements they don't have. It is fine to reorder, re-emphasize, or rephrase real content.

CANDIDATE'S CURRENT RESUME:
Name: ${content.full_name || "N/A"}
Current summary: ${content.summary || "(empty)"}
Skills: ${content.skills?.join(", ") || "(none)"}
Experience (in order):
${(content.experience ?? [])
  .map((exp, i) => `${i}. ${exp.title || "Role"} at ${exp.company || "Company"}: ${exp.description || "(no description)"}`)
  .join("\n") || "(none)"}

TARGET JOB:
${job.title} at ${job.company}
${(job.description ?? "").slice(0, 6000)}

TASK — return JSON with:
1. "summary": a rewritten professional summary (2-4 sentences) emphasizing the real experience most relevant to this job. Write it in first person (e.g. "I am...", "I have...") — never third person or referring to the candidate by name.
2. "skills": the candidate's skill list, reordered to put job-relevant skills first — only skills already in their resume, do not add new ones.
3. "experience_descriptions": exactly ${content.experience?.length ?? 0} entries, one per experience item above in the same order, each a rewritten description emphasizing what's relevant to this job. Keep facts unchanged — rewrite emphasis and phrasing only.
4. "cover_letter": a tailored, specific cover letter (3-4 short paragraphs, professional, no placeholder brackets) referencing this job and company by name.`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model,
      max_tokens: 3000,
      output_config: { format: { type: "json_schema", schema: KIT_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });
    await logAiUsage(supabase, {
      userId,
      feature: "ai_generate_application",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return { ok: false, error: "No response from AI." };

    const parsed = JSON.parse(textBlock.text) as {
      summary: string;
      skills: string[];
      experience_descriptions: string[];
      cover_letter: string;
    };

    const tailoredContent: ResumeContent = {
      ...content,
      summary: parsed.summary,
      skills: parsed.skills.length ? parsed.skills : content.skills,
      experience: (content.experience ?? []).map((exp, i) => ({
        ...exp,
        description: parsed.experience_descriptions[i] ?? exp.description,
      })),
    };

    const jobSkills: string[] = job.skills ?? [];
    const candidateSkillSet = new Set((content.skills ?? []).map(norm));
    const matchedSkills = jobSkills.filter((s) => candidateSkillSet.has(norm(s)));
    const skillsToAddress = jobSkills.filter((s) => !candidateSkillSet.has(norm(s)));
    const profileMatchPct = careerProfile
      ? computeJobMatch(careerProfile, job).overallScore
      : jobSkills.length
        ? Math.round((matchedSkills.length / jobSkills.length) * 100)
        : null;

    const { data: newResume, error: resumeError } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        title: `${job.title} — Tailored for ${job.company}`,
        slug: `resume-${randomSuffix(8)}`,
        template: resume.template,
        content: tailoredContent,
      })
      .select("id")
      .single();
    if (resumeError || !newResume) return { ok: false, error: "Could not save tailored resume." };

    const { data: newCoverLetter, error: letterError } = await supabase
      .from("cover_letters")
      .insert({
        user_id: userId,
        job_id: job.id,
        title: `Cover letter — ${job.title} @ ${job.company}`,
        content: parsed.cover_letter,
      })
      .select("id")
      .single();
    if (letterError || !newCoverLetter) return { ok: false, error: "Could not save cover letter." };

    const { data: generation, error: generationError } = await supabase
      .from("ai_generations")
      .insert({
        user_id: userId,
        job_id: job.id,
        source_resume_id: resume.id,
        tailored_resume_id: newResume.id,
        cover_letter_id: newCoverLetter.id,
        matched_skills: matchedSkills,
        skills_to_address: skillsToAddress,
        profile_match_pct: profileMatchPct,
      })
      .select("id")
      .single();
    if (generationError || !generation) return { ok: false, error: "Could not save generation." };

    await supabase.from("review_checklist").insert({ ai_generation_id: generation.id });

    return { ok: true, generationId: generation.id };
  } catch (err) {
    console.error("Prepared application kit failed", err);
    await logAiUsage(supabase, {
      userId,
      feature: "ai_generate_application",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return { ok: false, error: "Could not prepare the application." };
  }
}
