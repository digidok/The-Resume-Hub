import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { spendCredits } from "@/lib/credits";
import { computeJobMatch } from "@/lib/matching/job-match";
import { randomSuffix } from "@/lib/slug";
import { logAiUsage } from "@/lib/ai/usage";
import type { CareerProfile, Job, ResumeContent } from "@/types/database";

const GENERATION_SCHEMA = {
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

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured. Set ANTHROPIC_API_KEY on the server." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const resumeId = body?.resumeId as string | undefined;
  const jobId = body?.jobId as string | undefined;
  const existingGenerationId = body?.generationId as string | undefined;
  if (!resumeId || !jobId) {
    return NextResponse.json({ error: "resumeId and jobId are required." }, { status: 400 });
  }

  const [{ data: resume, error: resumeError }, { data: job, error: jobError }, { data: careerProfileData }] =
    await Promise.all([
      supabase.from("resumes").select("id, title, template, content").eq("id", resumeId).eq("user_id", user.id).single(),
      supabase.from("jobs").select("*").eq("id", jobId).single(),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

  if (resumeError || !resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  if (jobError || !job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  const spend = await spendCredits(supabase, user.id, "ai_generate_application");
  if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: 402 });

  const content = resume.content as ResumeContent;
  const anthropic = new Anthropic({ apiKey });

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

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 3000,
      output_config: { format: { type: "json_schema", schema: GENERATION_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "ai_generate_application",
      model,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

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

    const jobSkills: string[] = (job as Job).skills ?? [];
    const candidateSkillSet = new Set((content.skills ?? []).map(norm));
    const matchedSkills = jobSkills.filter((s) => candidateSkillSet.has(norm(s)));
    const skillsToAddress = jobSkills.filter((s) => !candidateSkillSet.has(norm(s)));

    const careerProfile = (careerProfileData as CareerProfile | null) ?? null;
    const profileMatchPct = careerProfile
      ? computeJobMatch(careerProfile, job as Job).overallScore
      : jobSkills.length
        ? Math.round((matchedSkills.length / jobSkills.length) * 100)
        : null;

    let tailoredResumeId: string;
    let coverLetterId: string;
    let generationId: string;

    if (existingGenerationId) {
      const { data: existing, error: existingError } = await supabase
        .from("ai_generations")
        .select("*")
        .eq("id", existingGenerationId)
        .eq("user_id", user.id)
        .single();
      if (existingError || !existing) {
        return NextResponse.json({ error: "Generation not found." }, { status: 404 });
      }

      await Promise.all([
        supabase
          .from("resumes")
          .update({ content: tailoredContent, updated_at: new Date().toISOString() })
          .eq("id", existing.tailored_resume_id),
        supabase
          .from("cover_letters")
          .update({ content: parsed.cover_letter, updated_at: new Date().toISOString() })
          .eq("id", existing.cover_letter_id),
        supabase
          .from("ai_generations")
          .update({
            matched_skills: matchedSkills,
            skills_to_address: skillsToAddress,
            profile_match_pct: profileMatchPct,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id),
        supabase
          .from("review_checklist")
          .update({
            resume_reviewed: false,
            cover_letter_reviewed: false,
            contact_confirmed: false,
            work_auth_confirmed: false,
            salary_confirmed: false,
            questions_done: false,
            updated_at: new Date().toISOString(),
          })
          .eq("ai_generation_id", existing.id),
      ]);

      tailoredResumeId = existing.tailored_resume_id;
      coverLetterId = existing.cover_letter_id;
      generationId = existing.id;
    } else {
      const { data: newResume, error: newResumeError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: `${job.title} — Tailored for ${job.company}`,
          slug: `resume-${randomSuffix(8)}`,
          template: resume.template,
          content: tailoredContent,
        })
        .select("id")
        .single();
      if (newResumeError || !newResume) {
        return NextResponse.json({ error: "Could not save tailored resume." }, { status: 500 });
      }

      const { data: newCoverLetter, error: newCoverLetterError } = await supabase
        .from("cover_letters")
        .insert({
          user_id: user.id,
          job_id: job.id,
          title: `Cover letter — ${job.title} @ ${job.company}`,
          content: parsed.cover_letter,
        })
        .select("id")
        .single();
      if (newCoverLetterError || !newCoverLetter) {
        return NextResponse.json({ error: "Could not save cover letter." }, { status: 500 });
      }

      const { data: newGeneration, error: newGenerationError } = await supabase
        .from("ai_generations")
        .insert({
          user_id: user.id,
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
      if (newGenerationError || !newGeneration) {
        return NextResponse.json({ error: "Could not save generation." }, { status: 500 });
      }

      await supabase.from("review_checklist").insert({ ai_generation_id: newGeneration.id });

      tailoredResumeId = newResume.id;
      coverLetterId = newCoverLetter.id;
      generationId = newGeneration.id;
    }

    return NextResponse.json({
      generationId,
      tailoredResumeId,
      coverLetterId,
      matchedSkills,
      skillsToAddress,
      profileMatchPct,
      tailoredContent,
      coverLetterContent: parsed.cover_letter,
      credits_remaining: spend.remaining,
    });
  } catch (err) {
    console.error("AI application generation failed", err);
    await logAiUsage(supabase, {
      userId: user.id,
      feature: "ai_generate_application",
      model,
      success: false,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json({ error: "Could not generate application. Please try again." }, { status: 500 });
  }
}
