import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumePreview } from "@/components/resume/resume-preview";
import { PrintButton } from "@/components/resume/print-button";
import { emptyResumeContent, type ResumeContent } from "@/types/database";

export default async function PublicResumePage({
  params,
}: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("template, content, title, is_public")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!resume) notFound();

  const content: ResumeContent = { ...emptyResumeContent(), ...(resume.content ?? {}) };

  return (
    <div className="min-h-full bg-slate-100 py-8">
      <div className="mx-auto mb-4 flex max-w-[8.5in] items-center justify-between px-4 print:hidden">
        <p className="text-sm text-slate-500">{resume.title}</p>
        <PrintButton />
      </div>
      <ResumePreview content={content} template={resume.template} />
    </div>
  );
}
