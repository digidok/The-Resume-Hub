import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AtsScannerForm } from "@/components/dashboard/ats-scanner-form";
import { Card } from "@/components/ui/card";

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
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">ATS scanner</h1>
      <p className="mb-6 text-sm text-slate-500">
        Get an ATS-style match score and feedback on any of your resumes.
      </p>
      <Card className="p-6">
        <AtsScannerForm resumes={resumes ?? []} />
      </Card>
    </div>
  );
}
