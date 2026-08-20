import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LinkedInPackCard } from "@/components/linkedin/linkedin-pack-card";
import type { LinkedInCopyPack } from "@/types/database";

export default async function LinkedInCopyPackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: packs } = await supabase
    .from("linkedin_copy_packs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">LinkedIn Copy Pack</h1>
      <p className="mb-6 text-sm text-slate-500">
        Ready-to-paste text for your LinkedIn profile — headline, About section, experience bullets,
        and skills. Copy each section straight into LinkedIn, or tweak the wording first.
      </p>

      {(!packs || packs.length === 0) && (
        <Card className="p-8 text-center text-slate-500">
          You don&apos;t have a LinkedIn Copy Pack yet — this is delivered as part of the LinkedIn
          Revamp service.
        </Card>
      )}

      <div className="space-y-6">
        {(packs as LinkedInCopyPack[] | null)?.map((pack) => <LinkedInPackCard key={pack.id} pack={pack} />)}
      </div>
    </div>
  );
}
