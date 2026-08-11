"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function recordInterviewNoteFile(
  jobId: string,
  applicationId: string,
  fileName: string,
  storagePath: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("interview_note_files").insert({
    application_id: applicationId,
    employer_id: user.id,
    file_name: fileName,
    storage_path: storagePath,
  });

  revalidatePath(`/dashboard/jobs/${jobId}/applicants/${applicationId}/notes`);
  return { error: error?.message };
}

export async function getInterviewNoteDownloadUrl(storagePath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.storage
    .from("interview-notes")
    .createSignedUrl(storagePath, 60);

  return { url: data?.signedUrl, error: error?.message };
}

export async function deleteInterviewNoteFile(
  jobId: string,
  applicationId: string,
  fileId: string,
  storagePath: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.storage.from("interview-notes").remove([storagePath]);
  await supabase.from("interview_note_files").delete().eq("id", fileId);

  revalidatePath(`/dashboard/jobs/${jobId}/applicants/${applicationId}/notes`);
}
