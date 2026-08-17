import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasUnlimitedCredits } from "@/lib/credits";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { MockInterviewClient } from "@/components/mock-interview/mock-interview-client";

export default async function MockInterviewPage() {
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
        feature="Mock Interview Coach"
        description="Practice with AI-generated interview questions tailored to any role, and get instant feedback on your answers — unlocked with Resume Hub Pro."
      />
    );
  }

  return <MockInterviewClient />;
}
