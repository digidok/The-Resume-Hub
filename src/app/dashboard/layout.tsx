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
    .select("role, full_name, plan, credits_remaining, job_posting_credits")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "candidate";

  const candidateNavGroups = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/jobs", label: "Find jobs" },
        { href: "/dashboard/applications", label: "Applications" },
        { href: "/dashboard/bulk-apply", label: "Bulk apply" },
        { href: "/dashboard/ai-generator", label: "AI generator" },
      ],
    },
    {
      label: "Documents",
      items: [
        { href: "/dashboard/resumes", label: "Resumes" },
        { href: "/dashboard/cover-letters", label: "Cover letters" },
        { href: "/dashboard/ats-scanner", label: "ATS scanner" },
        { href: "/dashboard/saved-jobs", label: "Saved jobs" },
      ],
    },
    {
      label: "Prep & tools",
      items: [
        { href: "/dashboard/mock-interview", label: "Mock interview" },
        { href: "/dashboard/follow-ups", label: "Follow-ups" },
        { href: "/dashboard/salary-insights", label: "Salary insights" },
        { href: "/dashboard/auto-apply", label: "Auto-apply" },
        { href: "/dashboard/import", label: "LinkedIn → CV" },
        { href: "/dashboard/profile", label: "Profile & visibility" },
      ],
    },
  ];

  const employerNavGroups = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/jobs", label: "My job posts" },
        { href: "/dashboard/jobs/new", label: "Post a job" },
        { href: "/jobs", label: "Public job board" },
      ],
    },
    {
      label: "Hiring",
      items: [
        { href: "/dashboard/interviews", label: "Interviews" },
        { href: "/dashboard/candidates", label: "Candidate pool" },
        { href: "/dashboard/analytics", label: "Analytics" },
      ],
    },
  ];

  const adminNavGroups = [
    {
      label: "Platform",
      items: [
        { href: "/dashboard", label: "Overview" },
        { href: "/dashboard/admin/users", label: "Users" },
        { href: "/dashboard/admin/jobs", label: "Jobs" },
        { href: "/dashboard/admin/payments", label: "Payments" },
      ],
    },
  ];

  const navGroups =
    role === "admin" ? adminNavGroups : role === "employer" ? employerNavGroups : candidateNavGroups;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r md:overflow-y-auto">
        <Link href="/" className="mb-6 text-lg font-bold text-slate-900">
          Resume Hub
        </Link>
        <nav className="flex flex-1 flex-col gap-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-4">
          {role === "candidate" && (
            <Link
              href="/dashboard/subscription"
              className="mb-3 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm"
            >
              <span className="font-medium capitalize text-indigo-700">{profile?.plan ?? "free"} plan</span>
              <span className="text-indigo-600">{profile?.credits_remaining ?? 0} credits</span>
            </Link>
          )}
          {role === "employer" && (
            <Link
              href="/dashboard/subscription"
              className="mb-3 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-indigo-700">Billing</span>
              <span className="text-indigo-600">{profile?.job_posting_credits ?? 0} job posts left</span>
            </Link>
          )}
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
