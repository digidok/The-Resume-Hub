import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomSuffix } from "@/lib/slug";
import { syncResumeToCareerPassport } from "@/lib/career/actions";
import type { ResumeContent } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const content = body?.content as ResumeContent | undefined;
  if (!content || !Array.isArray(content.experience) || !Array.isArray(content.education)) {
    return NextResponse.json({ error: "Missing or invalid resume content." }, { status: 400 });
  }

  const sourceFilePath = typeof body?.sourceFilePath === "string" ? body.sourceFilePath : null;
  const careerExtras = body?.careerExtras as
    | { professionalTitle?: string; certifications?: string[]; linkedinUrl?: string }
    | undefined;

  const { data: resume, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: content.full_name ? `${content.full_name}'s Resume` : "Imported Resume",
      slug: `resume-${randomSuffix(8)}`,
      content,
      source_file_path: sourceFilePath,
    })
    .select("id")
    .single();

  if (error || !resume) {
    return NextResponse.json({ error: "Could not save your CV. Please try again." }, { status: 500 });
  }

  await syncResumeToCareerPassport(content, careerExtras);

  return NextResponse.json({ resumeId: resume.id });
}
