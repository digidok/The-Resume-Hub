import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OfferResponse } from "@/components/offers/offer-response";
import { Card } from "@/components/ui/card";
import type { OfferLetterStatus } from "@/types/database";

export default async function CandidateOfferLetterPage({
  params,
}: PageProps<"/dashboard/applications/[id]/offer">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: application } = await supabase
    .from("applications")
    .select("id, jobs:job_id(title, company)")
    .eq("id", id)
    .eq("candidate_id", user.id)
    .single();
  if (!application) notFound();

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;

  const { data: offer } = await supabase
    .from("offer_letters")
    .select("id, content, status")
    .eq("application_id", id)
    .maybeSingle();

  if (!offer) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/applications" className="text-sm text-brand-600 hover:underline">
        ← My applications
      </Link>
      <h1 className="mb-1 mt-1 text-3xl font-bold text-slate-900">Offer letter</h1>
      <p className="mb-6 text-sm text-slate-500">
        {job?.title} at {job?.company}
      </p>
      <Card className="p-6">
        <p className="whitespace-pre-line text-sm text-slate-800">{offer.content}</p>
        <OfferResponse
          offerId={offer.id}
          applicationId={id}
          status={offer.status as OfferLetterStatus}
        />
      </Card>
    </div>
  );
}
