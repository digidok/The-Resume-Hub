"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CareerDocumentType } from "@/types/database";

export async function addCareerDocument(input: {
  documentType: CareerDocumentType;
  storagePath: string;
  fileName: string;
  fileSize: number;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("career_documents").insert({
    user_id: user.id,
    document_type: input.documentType,
    storage_path: input.storagePath,
    file_name: input.fileName,
    file_size: input.fileSize,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/career-passport");
  return {};
}

export async function deleteCareerDocument(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: doc } = await supabase
    .from("career_documents")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!doc) return { error: "Document not found." };

  await supabase.storage.from("career-documents").remove([doc.storage_path]);
  const { error } = await supabase.from("career_documents").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/career-passport");
  return {};
}
