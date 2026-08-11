import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { AutoApplyForm } from "@/components/dashboard/auto-apply-form";

export default async function AutoApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: resumes }, { data: settings }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("auto_apply_settings").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Auto-apply</h1>
      <p className="mb-6 text-sm text-slate-500">
        Automatically apply to open Resume Hub jobs that match your keywords — run it now, or
        turn on the daily scheduled run and we&apos;ll keep applying for you and email you when we
        do.
      </p>
      <AutoApplyForm resumes={resumes ?? []} initialSettings={settings ?? null} />
    </div>
  );
}
