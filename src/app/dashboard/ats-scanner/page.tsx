import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { ScanSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AtsScannerForm } from "@/components/dashboard/ats-scanner-form";
import { Card } from "@/components/ui/card";

const TIPS = [
  "Paste the actual job description for a tailored score, not just a generic scan.",
  "A high score means better keyword and formatting alignment — not a guaranteed interview.",
  "Rerun the scan after editing your resume to see the score change in real time.",
];

export default async function AtsScannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">ATS scanner</h1>
      <p className="mb-6 text-sm text-slate-500">
        Get an ATS-style match score and feedback on any of your resumes.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <AtsScannerForm resumes={resumes ?? []} />
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-900">Getting an accurate score</p>
          </div>
          <ul className="mt-3 space-y-2.5">
            {TIPS.map((tip) => (
              <li key={tip} className="text-sm text-slate-600">
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
