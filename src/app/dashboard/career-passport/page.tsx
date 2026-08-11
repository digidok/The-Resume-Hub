import { redirect } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { CareerPassportForm } from "@/components/career/career-passport-form";
import type { CareerProfile } from "@/types/database";

export default async function CareerPassportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("career_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Career Passport</h1>
      <p className="mb-6 text-sm text-slate-500">
        Your professional profile in one place — used to tailor your CVs and match you with jobs,
        so you don&apos;t have to re-enter the same information every time.
      </p>
      <CareerPassportForm profile={(profile as CareerProfile) ?? null} />
    </div>
  );
}
