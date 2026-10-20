import { createClient } from "@/lib/supabase/server";

/** Exact number of jobs currently open on the board. Returns null if it can't be read. */
export async function getOpenJobCount(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    if (error || count == null) return null;
    return count;
  } catch {
    return null;
  }
}
