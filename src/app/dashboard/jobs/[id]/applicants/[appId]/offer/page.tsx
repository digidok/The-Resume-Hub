import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OfferLetterEditor } from "@/components/offers/offer-letter-editor";
import { VerificationPanel } from "@/components/offers/verification-panel";
import type { VerificationStatus } from "@/types/database";

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
    .select("id, candidate_id, verification_status, verification_requested_at, profiles:candidate_id(full_name)")
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

  const { data: careerProfile } = await supabase
    .from("career_profiles")
    .select("background_consent_given")
    .eq("user_id", application.candidate_id)
    .maybeSingle();

  const consentGiven = careerProfile?.background_consent_given ?? false;
  const verificationStatus = application.verification_status as VerificationStatus;

  let documents: { fileName: string; documentType: string; signedUrl: string | null }[] = [];
  if (consentGiven && verificationStatus !== "not_requested") {
    const { data: docs } = await supabase
      .from("career_documents")
      .select("storage_path, file_name, document_type")
      .eq("user_id", application.candidate_id);
    documents = await Promise.all(
      (docs ?? []).map(async (doc) => {
        const { data: signed } = await supabase.storage
          .from("career-documents")
          .createSignedUrl(doc.storage_path, 60 * 10);
        return { fileName: doc.file_name, documentType: doc.document_type, signedUrl: signed?.signedUrl ?? null };
      })
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/dashboard/jobs/${id}/applicants`}
          className="text-sm text-brand-600 hover:underline"
        >
          ← Applicants
        </Link>
        <h1 className="mb-1 mt-1 text-3xl font-bold text-slate-900">
          Offer letter: {candidate?.full_name || "Candidate"}
        </h1>
        <p className="text-sm text-slate-500">{job.title}</p>
      </div>
      <OfferLetterEditor
        jobId={id}
        applicationId={appId}
        initialContent={offer?.content ?? ""}
        initialStatus={offer?.status ?? null}
      />
      <VerificationPanel
        jobId={id}
        applicationId={appId}
        consentGiven={consentGiven}
        verificationStatus={verificationStatus}
        requestedAt={application.verification_requested_at}
        documents={documents}
      />
    </div>
  );
}
