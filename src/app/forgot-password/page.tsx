import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Reset Password — Resume Hub",
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Resume Hub
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the email on your account and we&apos;ll send a link to reset it.
          </p>
        </div>
        {error === "expired" && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700">
            That reset link expired or was already used. Request a new one below.
          </p>
        )}
        <Card className="p-6">
          <ForgotPasswordForm />
        </Card>
      </div>
    </div>
  );
}
