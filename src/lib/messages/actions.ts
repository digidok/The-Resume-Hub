"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(connectionId: string, body: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Message can't be empty." };
  }

  const { error } = await supabase.from("messages").insert({
    connection_id: connectionId,
    sender_id: user.id,
    body: trimmed,
  });

  if (error) {
    return { error: "Could not send your message — you may no longer be connected." };
  }

  revalidatePath(`/dashboard/connections/${connectionId}/chat`);
  return {};
}

export async function shareJobWithConnection(
  connectionId: string,
  jobId: string,
  note: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase.from("jobs").select("title, company").eq("id", jobId).single();
  if (!job) {
    return { error: "Job not found." };
  }

  const trimmedNote = note.trim();
  const body = trimmedNote
    ? `${trimmedNote}\n\nShared a job: ${job.title} at ${job.company}`
    : `Shared a job: ${job.title} at ${job.company}`;

  const { error } = await supabase.from("messages").insert({
    connection_id: connectionId,
    sender_id: user.id,
    body,
    job_id: jobId,
  });

  if (error) {
    return { error: "Could not share this job — you may no longer be connected." };
  }

  revalidatePath(`/dashboard/connections/${connectionId}/chat`);
  return {};
}
