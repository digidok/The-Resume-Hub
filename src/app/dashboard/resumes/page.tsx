import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createResume } from "@/lib/resumes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ResumesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, template, is_public, slug, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">My resumes</h1>
        <form action={createResume}>
          <Button type="submit">+ New resume</Button>
        </form>
      </div>

      {(!resumes || resumes.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          You haven&apos;t created a resume yet. Click &quot;New resume&quot; to get started.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {resumes?.map((resume) => (
          <Link key={resume.id} href={`/dashboard/resumes/${resume.id}`}>
            <Card className="p-5 transition hover:border-indigo-300 hover:shadow-md">
              <h2 className="font-semibold text-slate-900">{resume.title}</h2>
              <p className="mt-1 text-sm capitalize text-slate-500">
                {resume.template} template
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    resume.is_public
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {resume.is_public ? "Public" : "Private"}
                </span>
                <span className="text-slate-400">
                  Updated {new Date(resume.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
