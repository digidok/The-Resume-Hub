import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Sign Up — Resume Hub",
};

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const { redirect: redirectParam, error, ref } = await searchParams;
  const redirectTo =
    typeof redirectParam === "string" ? redirectParam : "/dashboard";
  const referredByCode = typeof ref === "string" ? ref : undefined;
  const oauthError =
    error === "work_email_required"
      ? "Employer accounts need a company email address — personal email addresses (Gmail, Yahoo, Outlook, etc.) aren't allowed. Please sign up with your work email."
      : undefined;

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Resume Hub
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create your account</h1>
        </div>
        <Card className="p-6">
          <SignupForm redirectTo={redirectTo} initialError={oauthError} referredByCode={referredByCode} />
        </Card>
      </div>
    </div>
  );
}
