import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ResumeEditor } from "@/components/resume/resume-editor";
import { deleteResume, duplicateResume } from "@/lib/resumes/actions";
import { Button } from "@/components/ui/button";
import { emptyResumeContent, type Resume } from "@/types/database";

export default async function ResumeEditPage({
  params,
  searchParams,
}: PageProps<"/dashboard/resumes/[id]">) {
  const { id } = await params;
  const { job: jobId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let initialJobDescription = "";
  if (typeof jobId === "string") {
    const { data: job } = await supabase
      .from("jobs")
      .select("title, company, description")
      .eq("id", jobId)
      .single();
    if (job) {
      initialJobDescription = `${job.title} at ${job.company}\n\n${job.description}`;
    }
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!resume) notFound();

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = host ? `${protocol}://${host}` : "";

  const normalized: Resume = {
    ...resume,
    content: { ...emptyResumeContent(), ...(resume.content ?? {}) },
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/resumes" className="text-sm text-brand-600 hover:underline">
            ← All resumes
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Edit resume</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/resumes/${resume.id}/print`}>
            <Button variant="outline" size="sm">
              Print / PDF
            </Button>
          </Link>
          <form action={duplicateResume.bind(null, resume.id)}>
            <Button type="submit" variant="outline" size="sm">
              Duplicate
            </Button>
          </form>
          <form action={deleteResume.bind(null, resume.id)}>
            <Button type="submit" variant="danger" size="sm">
              Delete
            </Button>
          </form>
        </div>
      </div>
      <ResumeEditor resume={normalized} siteUrl={siteUrl} initialJobDescription={initialJobDescription} />
    </div>
  );
}
