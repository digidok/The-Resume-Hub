import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createResume, deleteResume, duplicateResume } from "@/lib/resumes/actions";
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
    .select("id, title, template, is_public, slug, updated_at, parent_resume_id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const resumeIds = (resumes ?? []).map((r) => r.id);
  const parentIds = [...new Set((resumes ?? []).map((r) => r.parent_resume_id).filter((id): id is string => Boolean(id)))];
  const { data: parentRows } = parentIds.length
    ? await supabase.from("resumes").select("id, title").in("id", parentIds)
    : { data: [] };
  const titleByParentId = new Map((parentRows ?? []).map((r) => [r.id, r.title]));
  const { data: reviewRows } = resumeIds.length
    ? await supabase
        .from("ai_reviews")
        .select("resume_id, score, created_at")
        .in("resume_id", resumeIds)
        .not("score", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Each CV gets its own score — keep only the most recent scan per resume_id.
  const latestScoreByResume = new Map<string, number>();
  for (const row of reviewRows ?? []) {
    if (!latestScoreByResume.has(row.resume_id)) {
      latestScoreByResume.set(row.resume_id, row.score as number);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My resumes</h1>
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
          <Card key={resume.id} className="p-5 transition hover:border-brand-300 hover:shadow-md">
            <Link href={`/dashboard/resumes/${resume.id}`}>
              <h2 className="font-semibold text-slate-900">{resume.title}</h2>
              <p className="mt-1 text-sm capitalize text-slate-500">
                {resume.template} template
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    resume.is_public
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {resume.is_public ? "Public" : "Private"}
                </span>
                {latestScoreByResume.has(resume.id) ? (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                    {latestScoreByResume.get(resume.id)}% ATS score
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    Not scanned yet
                  </span>
                )}
                <span className="text-slate-400">
                  Updated {new Date(resume.updated_at).toLocaleDateString()}
                </span>
              </div>
              {resume.parent_resume_id && titleByParentId.has(resume.parent_resume_id) && (
                <p className="mt-2 text-xs text-slate-400">
                  Tailored from &ldquo;{titleByParentId.get(resume.parent_resume_id)}&rdquo;
                </p>
              )}
            </Link>
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <form action={duplicateResume.bind(null, resume.id)}>
                <Button type="submit" variant="outline" size="sm">
                  Duplicate
                </Button>
              </form>
              <form action={deleteResume.bind(null, resume.id)}>
                <Button type="submit" variant="outline" size="sm">
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
