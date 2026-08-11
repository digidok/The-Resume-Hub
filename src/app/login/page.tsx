import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo =
    typeof redirectParam === "string" ? redirectParam : "/dashboard";

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Resume Hub
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Welcome back</h1>
        </div>
        <Card className="p-6">
          <LoginForm redirectTo={redirectTo} />
        </Card>
      </div>
    </div>
  );
}
