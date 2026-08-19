import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "You're all set — Resume Hub",
};

export default function InterviewReadySuccessPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <Card className="w-full p-8">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-500" />
        <h1 className="mt-3 text-xl font-semibold text-slate-900">You&apos;re all set!</h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re confirming your payment with Payfast — your prep pack will start landing on
          WhatsApp within a few minutes once that&apos;s done.
        </p>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-5 text-left">
          <p className="text-sm font-semibold text-slate-900">
            Want your CV professionally reviewed too?
          </p>
          <p className="mt-1 text-xs text-slate-600">
            You&apos;ve already got a Resume Hub account — upload your CV and get an AI-powered
            review, ATS check, and tailored improvements, free to start.
          </p>
          <Link href="/dashboard/import">
            <Button className="mt-3 w-full" size="sm">
              Add my CV review
            </Button>
          </Link>
        </div>

        <Link href="/dashboard" className="mt-4 block text-xs font-medium text-slate-400 hover:text-slate-600">
          No thanks, take me to my dashboard
        </Link>
      </Card>
    </div>
  );
}
