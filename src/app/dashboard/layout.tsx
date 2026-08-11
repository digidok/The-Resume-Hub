import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "candidate";

  const candidateNav = [
    { href: "/dashboard/resumes", label: "My resumes" },
    { href: "/dashboard/applications", label: "My applications" },
    { href: "/jobs", label: "Browse jobs" },
  ];
  const employerNav = [
    { href: "/dashboard/jobs", label: "My job posts" },
    { href: "/dashboard/jobs/new", label: "Post a job" },
    { href: "/jobs", label: "Public job board" },
  ];
  const nav = role === "employer" ? employerNav : candidateNav;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <Link href="/" className="mb-6 text-lg font-bold text-slate-900">
          Resume Hub
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="truncate text-sm font-medium text-slate-900">
            {profile?.full_name || user.email}
          </p>
          <p className="mb-3 text-xs capitalize text-slate-500">{role}</p>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
