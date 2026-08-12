"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VerificationStatus } from "@/types/database";

/**
 * Marks that an employer has asked to verify a candidate's background and
 * qualifications. This does not itself contact any verification provider —
 * Resume Hub has no vendor integration yet (e.g. LexisNexis) — it only
 * flips the flag that (combined with the candidate's standing consent)
 * grants the employer read access to the candidate's uploaded documents,
 * so they can action the check manually or through their own provider.
 */
export async function requestVerification(jobId: string, applicationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("applications")
    .update({ verification_status: "requested", verification_requested_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("job_id", jobId);

  revalidatePath(`/dashboard/jobs/${jobId}/applicants/${applicationId}/offer`);
}

export async function setVerificationStatus(
  jobId: string,
  applicationId: string,
  status: VerificationStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("applications").update({ verification_status: status }).eq("id", applicationId).eq("job_id", jobId);

  revalidatePath(`/dashboard/jobs/${jobId}/applicants/${applicationId}/offer`);
}
