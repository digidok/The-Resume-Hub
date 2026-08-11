import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccessPage() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <Card className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Thanks!</h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re confirming your payment with Payfast — your credits will appear within a minute
          or two once that&apos;s done.
        </p>
        <Link href="/dashboard/subscription">
          <Button className="mt-6">Back to subscription</Button>
        </Link>
      </Card>
    </div>
  );
}
