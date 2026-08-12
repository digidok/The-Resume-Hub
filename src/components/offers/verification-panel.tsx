import { FileText, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requestVerification, setVerificationStatus } from "@/lib/verification/actions";
import type { VerificationStatus } from "@/types/database";

const STATUS_LABELS: Record<VerificationStatus, string> = {
  not_requested: "Not requested",
  requested: "Requested",
  in_progress: "In progress",
  passed: "Passed",
  failed: "Failed",
};

const STATUS_STYLES: Record<VerificationStatus, string> = {
  not_requested: "bg-slate-100 text-slate-500",
  requested: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  passed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

const UPDATABLE_STATUSES: VerificationStatus[] = ["in_progress", "passed", "failed"];

export function VerificationPanel({
  jobId,
  applicationId,
  consentGiven,
  verificationStatus,
  requestedAt,
  documents,
}: {
  jobId: string;
  applicationId: string;
  consentGiven: boolean;
  verificationStatus: VerificationStatus;
  requestedAt: string | null;
  documents: { fileName: string; documentType: string; signedUrl: string | null }[];
}) {
  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Background & qualification verification
        </h2>
      </div>

      {!consentGiven ? (
        <p className="text-sm text-slate-500">
          This candidate hasn&apos;t consented to background verification yet. You&apos;ll be able
          to request one and view their documents once they do.
        </p>
      ) : verificationStatus === "not_requested" ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            The candidate has consented to sharing verification documents once you request a
            check. Resume Hub doesn&apos;t run the check itself — this makes their documents
            available to you to action with your verification provider (e.g. LexisNexis).
          </p>
          <form action={requestVerification.bind(null, jobId, applicationId)}>
            <Button type="submit" size="sm">
              Request verification
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[verificationStatus]}`}>
              {STATUS_LABELS[verificationStatus]}
            </span>
            {requestedAt && (
              <span className="text-xs text-slate-400">
                Requested {new Date(requestedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">Candidate hasn&apos;t uploaded any documents yet.</p>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc, i) =>
                doc.signedUrl ? (
                  <a
                    key={i}
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-600 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    {doc.fileName}
                  </a>
                ) : null
              )}
            </div>
          )}

          <form
            action={async (formData: FormData) => {
              "use server";
              const status = formData.get("status") as VerificationStatus;
              await setVerificationStatus(jobId, applicationId, status);
            }}
            className="flex items-center gap-2"
          >
            <select
              name="status"
              defaultValue={UPDATABLE_STATUSES.includes(verificationStatus) ? verificationStatus : "in_progress"}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            >
              {UPDATABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline">
              Update
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
