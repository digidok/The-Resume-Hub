import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Blog — Resume Hub",
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, category, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resume Hub Blog</h1>
          <p className="mt-2 text-slate-600">
            Career tips, labour rights explainers, and the latest on how we&apos;re building Resume
            Hub.
          </p>

          <div className="mt-10 space-y-5">
            {(posts ?? []).length === 0 && (
              <p className="text-sm text-slate-500">No posts published yet — check back soon.</p>
            )}
            {(posts ?? []).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                  <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {post.category}
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{post.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
                  {post.published_at && (
                    <p className="mt-3 text-xs text-slate-400">
                      {new Date(post.published_at).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
