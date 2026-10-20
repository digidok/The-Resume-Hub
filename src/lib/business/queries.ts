import type { SupabaseClient } from "@supabase/supabase-js";

/** Signed download URLs (1 hour) for files in a private bucket. Keyed by path. */
export async function signPaths(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out.set(item.path, item.signedUrl);
  }
  return out;
}
