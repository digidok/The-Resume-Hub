import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/messages/message-thread";
import type { Message } from "@/types/database";

export default async function ConnectionChatPage({
  params,
}: PageProps<"/dashboard/connections/[connectionId]/chat">) {
  const { connectionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: connection } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status")
    .eq("id", connectionId)
    .single();

  if (
    !connection ||
    connection.status !== "accepted" ||
    (connection.requester_id !== user.id && connection.recipient_id !== user.id)
  ) {
    notFound();
  }

  const counterpartId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;

  const [{ data: counterpart }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", counterpartId).single(),
    supabase
      .from("messages")
      .select("*")
      .eq("connection_id", connectionId)
      .order("created_at", { ascending: true }),
  ]);

  const unreadFromCounterpart = (messages ?? []).filter((m) => !m.read && m.sender_id === counterpartId);
  if (unreadFromCounterpart.length > 0) {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("connection_id", connectionId)
      .eq("sender_id", counterpartId)
      .eq("read", false);
  }

  const jobIds = [...new Set((messages ?? []).map((m) => m.job_id).filter((id): id is string => Boolean(id)))];
  const { data: sharedJobs } =
    jobIds.length > 0
      ? await supabase.from("jobs").select("id, title, company").in("id", jobIds)
      : { data: [] };
  const jobById = new Map((sharedJobs ?? []).map((j) => [j.id, j]));

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <BackLink href="/dashboard/connections" label="Connections" />
      <MessageThread
        connectionId={connectionId}
        counterpartName={counterpart?.full_name || "Someone"}
        counterpartAvatarUrl={counterpart?.avatar_url ?? null}
        viewerId={user.id}
        messages={(messages ?? []) as Message[]}
        jobById={Object.fromEntries(jobById)}
      />
    </div>
  );
}
