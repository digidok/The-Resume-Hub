import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
