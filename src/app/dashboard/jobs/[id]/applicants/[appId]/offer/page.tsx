import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OfferLetterEditor } from "@/components/offers/offer-letter-editor";

export default async function OfferLetterPage({
  params,
}: PageProps<"/dashboard/jobs/[id]/applicants/[appId]/offer">) {
  const { id, appId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();
  if (!job) notFound();

  const { data: application } = await supabase
    .from("applications")
    .select("id, profiles:candidate_id(full_name)")
    .eq("id", appId)
    .eq("job_id", id)
    .single();
  if (!application) notFound();

  const candidate = Array.isArray(application.profiles)
    ? application.profiles[0]
    : application.profiles;

  const { data: offer } = await supabase
    .from("offer_letters")
    .select("content, status")
    .eq("application_id", appId)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/dashboard/jobs/${id}/applicants`}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Applicants
      </Link>
      <h1 className="mb-1 mt-1 text-3xl font-bold text-slate-900">
        Offer letter: {candidate?.full_name || "Candidate"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">{job.title}</p>
      <OfferLetterEditor
        jobId={id}
        applicationId={appId}
        initialContent={offer?.content ?? ""}
        initialStatus={offer?.status ?? null}
      />
    </div>
  );
}
