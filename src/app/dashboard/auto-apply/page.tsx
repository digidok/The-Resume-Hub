import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AutoApplyForm } from "@/components/dashboard/auto-apply-form";
import { Card } from "@/components/ui/card";
import { hasUnlimitedCredits } from "@/lib/credits";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";

const TIPS = [
  "Keywords should match how the role is actually titled — \"React Developer\" not just \"Developer\".",
  "We only apply to jobs already open on the Resume Hub board.",
  "Turn on the daily scheduled run to keep applying automatically, or run it on demand any time.",
];

export default async function AutoApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_plan, subscription_expires_at")
    .eq("id", user.id)
    .single();

  if (!profile || !hasUnlimitedCredits(profile)) {
    return (
      <UpgradePrompt
        feature="Auto-Apply"
        description="Automatically apply to open Resume Hub jobs that match your keywords, on demand or on a daily schedule — unlocked with Resume Hub Pro."
      />
    );
  }

  const [{ data: resumes }, { data: settings }, { data: careerProfile }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("auto_apply_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("career_profiles")
      .select("professional_title, target_roles, skills")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const suggestedKeywords = Array.from(
    new Set(
      [
        careerProfile?.professional_title,
        ...(careerProfile?.target_roles ?? []),
        ...(careerProfile?.skills ?? []),
      ].filter((v): v is string => Boolean(v && v.trim()))
    )
  ).slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Auto-apply</h1>
      <p className="mb-6 text-sm text-slate-500">
        Automatically apply to open Resume Hub jobs that match your keywords — run it now, or
        turn on the daily scheduled run and we&apos;ll keep applying for you and email you when we
        do.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AutoApplyForm
            resumes={resumes ?? []}
            initialSettings={settings ?? null}
            suggestedKeywords={suggestedKeywords}
          />
        </div>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-900">Tips</p>
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
