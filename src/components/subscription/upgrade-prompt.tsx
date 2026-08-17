import Link from "next/link";
import { Lock } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UpgradePrompt({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Lock className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{feature} is a Pro feature</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <Link href="/dashboard/subscription">
          <Button>Upgrade to Pro</Button>
        </Link>
      </Card>
    </div>
  );
}
