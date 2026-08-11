"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify, randomSuffix } from "@/lib/slug";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return { supabase, userId: user.id };
}

export async function createBlogPost(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim() || "General";
  const published = formData.get("published") === "on";

  if (!title || !content) {
    redirect("/dashboard/admin/blog?error=Title+and+content+are+required");
  }

  const slug = `${slugify(title)}-${randomSuffix(5)}`;

  const { error } = await supabase.from("blog_posts").insert({
    author_id: userId,
    title,
    slug,
    excerpt,
    content,
    category,
    published,
    published_at: published ? new Date().toISOString() : null,
  });

  if (error) {
    redirect(`/dashboard/admin/blog?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/admin/blog");
  revalidatePath("/blog");
  redirect("/dashboard/admin/blog");
}

export async function setBlogPublished(postId: string, published: boolean) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("blog_posts")
    .update({ published, published_at: published ? new Date().toISOString() : null })
    .eq("id", postId);

  revalidatePath("/dashboard/admin/blog");
  revalidatePath("/blog");
}

export async function deleteBlogPost(postId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("blog_posts").delete().eq("id", postId);

  revalidatePath("/dashboard/admin/blog");
  revalidatePath("/blog");
}
