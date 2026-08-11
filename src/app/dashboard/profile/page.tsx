import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { setOpenToWork } from "@/lib/profile/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, open_to_work")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidate") {
    redirect("/dashboard");
  }

  const { count: publicResumeCount } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_public", true);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Profile &amp; visibility</h1>
      <p className="mb-6 text-sm text-slate-500">
        Control whether employers can find you in the Candidate Pool.
      </p>
      <Card className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-slate-900">Open to work</p>
            <p className="text-sm text-slate-500">
              When on, employers can browse your profile and public resumes in the Candidate Pool.
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await setOpenToWork(!profile.open_to_work);
            }}
          >
            <Button type="submit" variant={profile.open_to_work ? "outline" : "primary"}>
              {profile.open_to_work ? "Turn off" : "Turn on"}
            </Button>
          </form>
        </div>
        {profile.open_to_work && (publicResumeCount ?? 0) === 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            You&apos;re open to work, but none of your resumes are public yet. Mark a resume
            public from the Resumes page so employers have something to view.
          </p>
        )}
      </Card>
    </div>
  );
}
