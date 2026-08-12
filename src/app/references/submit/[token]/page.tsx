import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ReferenceSubmitForm } from "@/components/career/reference-submit-form";
import { getReferenceRequestByToken } from "@/lib/career-references/actions";

export const metadata = {
  title: "Submit a Reference — Resume Hub",
};

export default async function ReferenceSubmitPage({
  params,
}: PageProps<"/references/submit/[token]">) {
  const { token } = await params;
  const context = await getReferenceRequestByToken(token);
  if (!context) notFound();

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Resume Hub
          </Link>
        </div>
        <Card className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Reference request from {context.candidateName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {context.candidateName} has listed you as a reference and would like a short written
              reference. No account needed — this takes a couple of minutes.
            </p>
          </div>
          {context.status === "received" ? (
            <p className="text-sm text-emerald-700">
              A reference has already been submitted for this request — thank you.
            </p>
          ) : (
            <ReferenceSubmitForm token={token} />
          )}
        </Card>
      </div>
    </div>
  );
}
