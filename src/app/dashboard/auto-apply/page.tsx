import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AutoApplyForm } from "@/components/dashboard/auto-apply-form";

export default async function AutoApplyPage() {
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
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Auto-apply</h1>
      <p className="mb-6 text-sm text-slate-500">
        Automatically apply to open Resume Hub jobs that match your keywords.
      </p>
      <AutoApplyForm resumes={resumes ?? []} />
    </div>
  );
}
