"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendConnectionRequest(targetUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (targetUserId === user.id) {
    return { error: "You can't connect with yourself." };
  }

  const { error } = await supabase
    .from("connections")
    .insert({ requester_id: user.id, recipient_id: targetUserId, status: "pending" });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have a connection or pending request with this person." };
    }
    return { error: error.message };
  }

  const [{ data: requesterProfile }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  await supabase.from("notifications").insert({
    user_id: targetUserId,
    type: "connection_request",
    title: "New connection request",
    body: `${requesterProfile?.full_name || "Someone"} wants to connect with you.`,
  });

  revalidatePath("/dashboard/connections");
  return {};
}

export async function acceptConnectionRequest(connectionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: connection, error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .eq("recipient_id", user.id)
    .select("requester_id")
    .single();

  if (error) return { error: error.message };

  if (connection) {
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await supabase.from("notifications").insert({
      user_id: connection.requester_id,
      type: "connection_accepted",
      title: "Connection accepted",
      body: `${recipientProfile?.full_name || "Someone"} accepted your connection request.`,
    });
  }

  revalidatePath("/dashboard/connections");
  return {};
}

/** Covers declining a request, cancelling one you sent, and removing an
 * existing connection — all three are just "delete the row", allowed for
 * either party by RLS. */
export async function removeConnection(connectionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("connections").delete().eq("id", connectionId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/connections");
  revalidatePath("/dashboard/candidates");
  return {};
}
