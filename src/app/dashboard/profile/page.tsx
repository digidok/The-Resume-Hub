import Link from "next/link";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { Eye, FileText, IdCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setOpenToWork } from "@/lib/profile/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { HeadlineEditor } from "@/components/profile/headline-editor";
import { WhatsAppSettings } from "@/components/profile/whatsapp-settings";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, open_to_work, full_name, avatar_url, headline, phone_number, whatsapp_opt_in")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "candidate" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [{ count: publicResumeCount }, { count: careerProfileCount }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_public", true),
    supabase
      .from("career_profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Profile &amp; visibility</h1>
      <p className="mb-6 text-sm text-slate-500">
        Control whether employers can find you in the Candidate Pool.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <p className="mb-3 font-medium text-slate-900">Profile photo</p>
            <AvatarUploader
              userId={user.id}
              name={profile.full_name || user.email || "?"}
              avatarUrl={profile.avatar_url}
            />
          </Card>
          <Card className="p-6">
            <p className="mb-3 font-medium text-slate-900">Headline</p>
            <HeadlineEditor headline={profile.headline} />
          </Card>
          <Card className="p-6">
            <p className="mb-3 font-medium text-slate-900">WhatsApp</p>
            <WhatsAppSettings phoneNumber={profile.phone_number} whatsappOptIn={profile.whatsapp_opt_in} />
          </Card>
          <Card className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">In the market</p>
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
                You&apos;re marked as in the market, but none of your resumes are public yet. Mark a
                resume public from the Resumes page so employers have something to view.
              </p>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-900">Visibility status</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {profile.open_to_work
              ? "You're visible to employers in the Candidate Pool."
              : "You're hidden from the Candidate Pool."}
          </p>
          <div className="mt-4 space-y-2">
            <Link
              href="/dashboard/resumes"
              className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Public resumes
              </span>
              <span className="font-medium text-slate-900">{publicResumeCount ?? 0}</span>
            </Link>
            <Link
              href="/dashboard/career-passport"
              className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 text-slate-700">
                <IdCard className="h-3.5 w-3.5 text-slate-400" />
                Career Passport
              </span>
              <span className="font-medium text-slate-900">
                {careerProfileCount ? "Complete" : "Not started"}
              </span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
