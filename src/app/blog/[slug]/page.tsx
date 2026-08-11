import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BlogContent } from "@/components/blog/blog-content";

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, excerpt, content, category, published_at")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-2xl px-4 py-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
          <span className="mt-6 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {post.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{post.title}</h1>
          {post.published_at && (
            <p className="mt-2 text-sm text-slate-400">
              {new Date(post.published_at).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          <div className="mt-8">
            <BlogContent content={post.content} />
          </div>
          <p className="mt-10 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
            This article is general information, not legal advice. For advice on your specific
            situation, consult a labour lawyer, your union, or the CCMA.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
