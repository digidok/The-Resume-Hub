import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createBlogPost, setBlogPublished, deleteBlogPost } from "@/lib/blog/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";

export default async function AdminBlogPage({
  searchParams,
}: PageProps<"/dashboard/admin/blog">) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, category, published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <BackLink href="/dashboard" label="Dashboard" />
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Blog</h1>
        <p className="text-sm text-slate-500">
          {posts?.length ?? 0} post{(posts?.length ?? 0) === 1 ? "" : "s"} — publish articles that
          appear on /blog.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">New post</h2>
        {typeof error === "string" && <p className="text-sm text-red-600">{error}</p>}
        <form action={createBlogPost} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue="Employee rights">
              <option>Employee rights</option>
              <option>Employer obligations</option>
              <option>Career tips</option>
              <option>Product updates</option>
              <option>General</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" name="excerpt" rows={2} />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" name="content" rows={12} required />
            <p className="mt-1 text-xs text-slate-400">
              Plain text. Use blank lines between paragraphs, **bold** for emphasis, and lines
              starting with &quot;- &quot; for bullet lists.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="published"
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Publish immediately
          </label>
          <Button type="submit">Save post</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {(posts ?? []).map((post) => (
          <Card key={post.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-slate-900">{post.title}</p>
              <p className="text-sm text-slate-500">
                {post.category} ·{" "}
                {post.published ? (
                  <Link href={`/blog/${post.slug}`} className="text-brand-700 hover:underline">
                    View live
                  </Link>
                ) : (
                  "Draft"
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  post.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {post.published ? "Published" : "Draft"}
              </span>
              <form
                action={async () => {
                  "use server";
                  await setBlogPublished(post.id, !post.published);
                }}
              >
                <Button type="submit" size="sm" variant="outline">
                  {post.published ? "Unpublish" : "Publish"}
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteBlogPost(post.id);
                }}
              >
                <Button type="submit" size="sm" variant="ghost">
                  Delete
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
