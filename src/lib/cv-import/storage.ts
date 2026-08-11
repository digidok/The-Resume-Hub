import type { SupabaseClient } from "@supabase/supabase-js";
import { randomSuffix } from "@/lib/slug";
import type { CvSourceFile } from "./types";

const SAFE_NAME = /[^a-zA-Z0-9._-]/g;

export async function uploadCvSourceFile(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  buffer: Buffer
): Promise<CvSourceFile | null> {
  const safeName = file.name.replace(SAFE_NAME, "_").slice(-80) || "cv";
  const path = `${userId}/${randomSuffix(10)}-${safeName}`;

  const { error } = await supabase.storage
    .from("cv-uploads")
    .upload(path, buffer, { contentType: file.type || "application/octet-stream" });

  if (error) {
    console.error("CV source file upload failed", error);
    return null;
  }

  return { storagePath: path, fileName: file.name, fileSize: buffer.byteLength };
}
