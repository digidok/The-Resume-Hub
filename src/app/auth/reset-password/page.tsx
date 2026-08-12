import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Set New Password — Resume Hub",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=expired");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Resume Hub
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Set a new password</h1>
        </div>
        <Card className="p-6">
          <ResetPasswordForm />
        </Card>
      </div>
    </div>
  );
}
