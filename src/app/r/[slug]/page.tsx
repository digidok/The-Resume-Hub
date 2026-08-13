import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResumePreview } from "@/components/resume/resume-preview";
import { PrintButton } from "@/components/resume/print-button";
import { PublicProfileHeader } from "@/components/resume/public-profile-header";
import { ConnectButton } from "@/components/connections/connect-button";
import { deriveRelation, type ConnectionRelation } from "@/lib/connections/queries";
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
  // The same lookup also grabs the profile fields the LinkedIn-style header
  // needs (avatar, headline, open-to-work) since a visitor can't read them
  // directly either.
  let isPro = false;
  let avatarUrl: string | null = null;
  let headline: string | null = null;
  let openToWork = false;
  try {
    const admin = createAdminClient();
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("plan, subscription_plan, subscription_expires_at, avatar_url, headline, open_to_work")
      .eq("id", resume.user_id)
      .single();
    isPro = ownerProfile ? hasUnlimitedCredits(ownerProfile) : false;
    avatarUrl = ownerProfile?.avatar_url ?? null;
    headline = ownerProfile?.headline ?? null;
    openToWork = ownerProfile?.open_to_work ?? false;
  } catch (err) {
    console.error("Public resume: owner profile lookup failed, defaulting to gated", err);
  }

  let relation: ConnectionRelation = { status: "none" };
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (viewer && viewer.id !== resume.user_id) {
    const { data: existingConnection } = await supabase
      .from("connections")
      .select("id, requester_id, status")
      .or(
        `and(requester_id.eq.${viewer.id},recipient_id.eq.${resume.user_id}),and(requester_id.eq.${resume.user_id},recipient_id.eq.${viewer.id})`
      )
      .maybeSingle();
    relation = deriveRelation(existingConnection, viewer.id);
  }

  return (
    <div className="min-h-full bg-slate-100 py-8">
      <div className="mx-auto mb-4 flex max-w-[8.5in] items-center justify-between px-4 print:hidden">
        <p className="text-sm text-slate-500">{resume.title}</p>
        {isPro && <PrintButton />}
      </div>
      <PublicProfileHeader
        content={content}
        photoUrl={avatarUrl}
        headline={headline}
        openToWork={openToWork}
        connectButton={
          viewer && viewer.id !== resume.user_id ? (
            <ConnectButton targetUserId={resume.user_id} relation={relation} />
          ) : undefined
        }
      />
      <div className="mx-auto max-w-[8.5in] px-0 pt-6 print:pt-0">
        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400 print:hidden">
          Full resume
        </p>
        <ResumePreview content={content} template={resume.template} watermark={!isPro} />
      </div>
    </div>
  );
}
