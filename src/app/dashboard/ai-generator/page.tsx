import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AiGeneratorForm } from "@/components/dashboard/ai-generator-form";
import { Card } from "@/components/ui/card";

const TIPS = [
  "Pick the resume with the most relevant experience for this job.",
  "Choose a real open role so the letter references specifics — company, title, requirements.",
  "Review and personalize the draft before sending; it's a starting point, not a final copy.",
];

export default async function AiGeneratorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">AI generator</h1>
      <p className="mb-6 text-sm text-slate-500">
        Generate a tailored resume and cover letter for a specific job, using your real resume content.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <AiGeneratorForm jobs={jobs ?? []} />
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-900">Getting a better result</p>
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
