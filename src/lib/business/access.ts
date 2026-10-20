import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Emails whose business data this user may see: their own, plus any owner who
 * has added them as an authorised team member. Row-level security enforces the
 * same rule in the database; this only builds the query filters.
 */
export async function getVisibleEmails(supabase: SupabaseClient, email: string): Promise<string[]> {
  const me = email.toLowerCase();
  const { data } = await supabase.from("business_members").select("owner_email").eq("member_email", me);
  const owners = (data ?? []).map((r: { owner_email: string }) => r.owner_email.toLowerCase());
  return Array.from(new Set([me, ...owners]));
}
