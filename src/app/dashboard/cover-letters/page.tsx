import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCoverLetter } from "@/lib/coverletters/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function CoverLettersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: coverLetters } = await supabase
    .from("cover_letters")
    .select("id, title, updated_at, jobs:job_id(title, company)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Cover letters</h1>
        <form action={createCoverLetter.bind(null, undefined)}>
          <Button type="submit">+ New cover letter</Button>
        </form>
      </div>

      {(!coverLetters || coverLetters.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          No cover letters yet. Click &quot;New cover letter&quot; to write one, or generate one
          tailored to a specific job from the AI Generator.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {coverLetters?.map((cl) => {
          const job = Array.isArray(cl.jobs) ? cl.jobs[0] : cl.jobs;
          return (
            <Link key={cl.id} href={`/dashboard/cover-letters/${cl.id}`}>
              <Card className="p-5 transition hover:border-brand-300 hover:shadow-md">
                <h2 className="font-semibold text-slate-900">{cl.title}</h2>
                {job && (
                  <p className="mt-1 text-sm text-slate-500">
                    For {job.title} at {job.company}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  Updated {new Date(cl.updated_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
