import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InterviewNotesUploader } from "@/components/interview-notes/interview-notes-uploader";
import type { InterviewNoteFile } from "@/types/database";

export default async function InterviewNotesPage({
  params,
}: PageProps<"/dashboard/jobs/[id]/applicants/[appId]/notes">) {
  const { id, appId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();
  if (!job) notFound();

  const { data: application } = await supabase
    .from("applications")
    .select("id, profiles:candidate_id(full_name)")
    .eq("id", appId)
    .eq("job_id", id)
    .single();
  if (!application) notFound();

  const candidate = Array.isArray(application.profiles)
    ? application.profiles[0]
    : application.profiles;

  const { data: files } = await supabase
    .from("interview_note_files")
    .select("*")
    .eq("application_id", appId)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/dashboard/jobs/${id}/applicants`}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Applicants
      </Link>
      <h1 className="mb-1 mt-1 text-2xl font-semibold text-slate-900">
        Interview notes: {candidate?.full_name || "Candidate"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">{job.title}</p>
      <InterviewNotesUploader
        jobId={id}
        applicationId={appId}
        files={(files ?? []) as InterviewNoteFile[]}
      />
    </div>
  );
}
