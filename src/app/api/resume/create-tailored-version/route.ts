import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomSuffix } from "@/lib/slug";
import type { ResumeContent } from "@/types/database";

/**
 * Persists the result of "Align to job" (src/app/api/resume/align-to-job)
 * as a brand new resume linked back to its source via parent_resume_id,
 * instead of overwriting the candidate's original CV in place — so tailoring
 * for job B never clobbers the tailoring already done for job A, and the
 * master CV stays untouched. No credit spend here: the AI call already
 * happened (and was charged) in align-to-job — this route only persists
 * its result.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const resumeId = body?.resumeId as string | undefined;
  const tailoredSummary = (body?.tailoredSummary as string | undefined)?.trim();
  const additionalSkills = Array.isArray(body?.additionalSkills)
    ? (body.additionalSkills as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  const jobTitle = (body?.jobTitle as string | undefined)?.trim();

  if (!resumeId || !tailoredSummary) {
    return NextResponse.json({ error: "resumeId and tailoredSummary are required." }, { status: 400 });
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("title, template, content")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();
  if (resumeError || !resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const sourceContent = resume.content as ResumeContent;
  const tailoredContent: ResumeContent = {
    ...sourceContent,
    summary: tailoredSummary,
    skills: Array.from(new Set([...sourceContent.skills, ...additionalSkills])),
  };

  const slug = `resume-${randomSuffix(8)}`;
  const { data: newResume, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: jobTitle ? `${resume.title} — ${jobTitle}` : `${resume.title} (tailored)`,
      slug,
      template: resume.template,
      content: tailoredContent,
      parent_resume_id: resumeId,
    })
    .select("id")
    .single();

  if (insertError || !newResume) {
    return NextResponse.json({ error: "Could not save tailored resume." }, { status: 500 });
  }

  return NextResponse.json({ resumeId: newResume.id });
}
