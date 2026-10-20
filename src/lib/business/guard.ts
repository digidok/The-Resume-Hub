import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "recruiter" | "consultant" | "payroll" | "delivery";

/** For admin pages: returns the user-session client (so row-level security still applies) or redirects. */
export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, user };
}

/**
 * For pages and actions that staff with a specific role may use. Administrators always pass.
 * Everything still runs on the user's own session, so database policies remain the real gate.
 */
export async function requireStaff(roles: StaffRole[]): Promise<{ supabase: SupabaseClient; user: User; isAdmin: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") return { supabase, user, isAdmin: true };
  const { data: held } = await supabase.from("staff_members").select("staff_role").eq("user_id", user.id);
  const ok = (held ?? []).some((r: { staff_role: string }) => roles.includes(r.staff_role as StaffRole));
  if (!ok) redirect("/dashboard");
  return { supabase, user, isAdmin: false };
}
