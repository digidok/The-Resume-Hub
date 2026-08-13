import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumePreview } from "@/components/resume/resume-preview";
import { PrintButton } from "@/components/resume/print-button";
import { emptyResumeContent, type ResumeContent } from "@/types/database";
import { hasUnlimitedCredits } from "@/lib/credits";

export default async function ResumePrintPage({
  params,
}: PageProps<"/dashboard/resumes/[id]/print">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_plan, subscription_expires_at")
    .eq("id", user.id)
    .single();
  const isPro = profile ? hasUnlimitedCredits(profile) : false;
  if (!isPro) {
    redirect("/dashboard/subscription?upgrade=print");
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("template, content")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!resume) notFound();

  const content: ResumeContent = { ...emptyResumeContent(), ...(resume.content ?? {}) };

  return (
    <div className="min-h-full bg-slate-100 py-8">
      <div className="mx-auto mb-4 flex max-w-[8.5in] justify-end px-4 print:hidden">
        <PrintButton />
      </div>
      <ResumePreview content={content} template={resume.template} />
    </div>
  );
}
