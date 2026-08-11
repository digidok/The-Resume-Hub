import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#features" className="hover:text-brand-700">
            Features
          </Link>
          <Link href="/signup" className="hover:text-brand-700">
            CV Builder
          </Link>
          <Link href="/jobs" className="hover:text-brand-700">
            Find Jobs
          </Link>
          <Link href="/signup" className="hover:text-brand-700">
            For Employers
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand-700">
                Sign in
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
