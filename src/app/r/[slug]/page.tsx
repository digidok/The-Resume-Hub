import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResumePreview } from "@/components/resume/resume-preview";
import { PrintButton } from "@/components/resume/print-button";
import { emptyResumeContent, type ResumeContent } from "@/types/database";
import { hasUnlimitedCredits } from "@/lib/credits";

export default async function PublicResumePage({
  params,
}: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("template, content, title, is_public, user_id")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!resume) notFound();

  const content: ResumeContent = { ...emptyResumeContent(), ...(resume.content ?? {}) };

  // The public link is a way around the in-app print/PDF gate (open the
  // link, use the browser's own Print/Save as PDF), so it needs the same
  // Pro check — done with the service-role client since a visitor here
  // isn't authenticated as the resume's owner and can't read their profile.
  let isPro = false;
  try {
    const admin = createAdminClient();
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("plan, subscription_plan, subscription_expires_at")
      .eq("id", resume.user_id)
      .single();
    isPro = ownerProfile ? hasUnlimitedCredits(ownerProfile) : false;
  } catch (err) {
    console.error("Public resume: owner plan lookup failed, defaulting to gated", err);
  }

  return (
    <div className="min-h-full bg-slate-100 py-8">
      <div className="mx-auto mb-4 flex max-w-[8.5in] items-center justify-between px-4 print:hidden">
        <p className="text-sm text-slate-500">{resume.title}</p>
        {isPro && <PrintButton />}
      </div>
      <ResumePreview content={content} template={resume.template} watermark={!isPro} />
    </div>
  );
}
