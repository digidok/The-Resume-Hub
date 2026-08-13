import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ConnectButton } from "@/components/connections/connect-button";
import { deriveRelation, type ConnectionRelation } from "@/lib/connections/queries";
import type { ResumeContent } from "@/types/database";

export default async function CandidatePoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "employer") {
    redirect("/dashboard");
  }

  const { data: candidates } = await supabase
    .from("profiles")
    .select("id, full_name, headline, avatar_url")
    .eq("role", "candidate")
    .eq("open_to_work", true);

  const candidateIds = (candidates ?? []).map((c) => c.id);

  const { data: resumes } = candidateIds.length
    ? await supabase
        .from("resumes")
        .select("user_id, title, slug, content, updated_at")
        .in("user_id", candidateIds)
        .eq("is_public", true)
        .order("updated_at", { ascending: false })
    : { data: [] };

  const resumeByUser = new Map<string, { title: string; slug: string; content: ResumeContent }>();
  for (const resume of resumes ?? []) {
    if (!resumeByUser.has(resume.user_id)) {
      resumeByUser.set(resume.user_id, {
        title: resume.title,
        slug: resume.slug,
        content: resume.content as ResumeContent,
      });
    }
  }

  const rows = (candidates ?? []).filter((c) => resumeByUser.has(c.id));

  const { data: existingConnections } = candidateIds.length
    ? await supabase
        .from("connections")
        .select("id, requester_id, recipient_id, status")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    : { data: [] };

  const relationByCandidate = new Map<string, ConnectionRelation>();
  for (const c of existingConnections ?? []) {
    const otherId = c.requester_id === user.id ? c.recipient_id : c.requester_id;
    if (!candidateIds.includes(otherId)) continue;
    relationByCandidate.set(otherId, deriveRelation(c, user.id));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Candidate pool</h1>
      <p className="mb-6 text-sm text-slate-500">
        Candidates who&apos;ve opted in to be discoverable, with a public resume to review.
      </p>

      {rows.length === 0 && (
        <Card className="p-8 text-center text-slate-500">
          No opted-in candidates with a public resume yet.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((candidate) => {
          const resume = resumeByUser.get(candidate.id)!;
          const skills = resume.content.skills ?? [];
          return (
            <Card key={candidate.id} className="p-5">
              <p className="font-semibold text-slate-900">{candidate.full_name || "Candidate"}</p>
              {candidate.headline && (
                <p className="text-sm text-slate-500">{candidate.headline}</p>
              )}
              {skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skills.slice(0, 8).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={`/r/${resume.slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                View resume: {resume.title} →
              </a>
              <div className="mt-3">
                <ConnectButton
                  targetUserId={candidate.id}
                  relation={relationByCandidate.get(candidate.id) ?? { status: "none" }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
