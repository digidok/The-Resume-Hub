import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { ResumeEditor } from "@/components/resume/resume-editor";
import { adminSaveResume, adminRenameResumeSlug } from "@/lib/admin/actions";
import { emptyResumeContent, type Resume } from "@/types/database";

export default async function AdminResumeEditPage({
  params,
}: PageProps<"/dashboard/admin/users/[id]/resumes/[resumeId]">) {
  const { id, resumeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (viewerProfile?.role !== "admin") redirect("/dashboard");

  const [{ data: resume }, { data: candidate }] = await Promise.all([
    supabase.from("resumes").select("*").eq("id", resumeId).eq("user_id", id).single(),
    supabase.from("profiles").select("full_name").eq("id", id).single(),
  ]);

  if (!resume) notFound();

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = host ? `${protocol}://${host}` : "";

  const normalized: Resume = {
    ...resume,
    content: { ...emptyResumeContent(), ...(resume.content ?? {}) },
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <BackLink href={`/dashboard/admin/users/${id}`} label={candidate?.full_name || "Candidate"} />
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Editing: {resume.title || "Untitled resume"}
        </h1>
      </div>
      <ResumeEditor
        resume={normalized}
        siteUrl={siteUrl}
        isPro={true}
        isAdminEditing={true}
        saveAction={adminSaveResume}
        renameSlugAction={adminRenameResumeSlug}
      />
    </div>
  );
}
