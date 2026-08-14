import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarShell } from "@/components/dashboard/sidebar-shell";
import { SidebarPlanCard } from "@/components/dashboard/sidebar-plan-card";
import { SidebarFooter } from "@/components/dashboard/sidebar-footer";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardNav, type NavGroup } from "@/components/dashboard/nav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, full_name, plan, credits_remaining, job_posting_credits, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const role = (profile?.role ?? "candidate") as "candidate" | "employer" | "admin";
  const unreadNotifications = (notifications ?? []).filter((n) => !n.read).length;

  const { count: pendingConnectionsCount } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("status", "pending");

  let candidateBadges = { applications: 0, savedJobs: 0 };
  if (role === "candidate" || role === "admin") {
    const [{ count: applicationsCount }, { count: savedJobsCount }] = await Promise.all([
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", user.id)
        .not("status", "in", "(hired,rejected)"),
      supabase.from("saved_jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    candidateBadges = { applications: applicationsCount ?? 0, savedJobs: savedJobsCount ?? 0 };
  }

  const candidateNavGroups: NavGroup[] = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
        { href: "/jobs", label: "Find jobs", icon: "Search" },
        { href: "/dashboard/applications", label: "Applications", icon: "ClipboardList", badge: candidateBadges.applications },
        { href: "/dashboard/bulk-apply", label: "Bulk apply", icon: "Layers" },
        { href: "/dashboard/ai-generator", label: "AI generator", icon: "Sparkles" },
      ],
    },
    {
      label: "Documents",
      items: [
        { href: "/dashboard/career-passport", label: "Career Passport", icon: "IdCard" },
        { href: "/dashboard/resumes", label: "My CV", icon: "FileText" },
        { href: "/dashboard/cover-letters", label: "Cover letters", icon: "Mail" },
        { href: "/dashboard/ats-scanner", label: "ATS scanner", icon: "ScanSearch" },
        { href: "/dashboard/saved-jobs", label: "Saved jobs", icon: "Bookmark", badge: candidateBadges.savedJobs },
      ],
    },
    {
      label: "Prep & tools",
      items: [
        { href: "/dashboard/mock-interview", label: "Interview Coach", icon: "MessageSquare" },
        { href: "/dashboard/follow-ups", label: "Follow-ups", icon: "Bell" },
        { href: "/dashboard/salary-insights", label: "Salary insights", icon: "DollarSign" },
        { href: "/dashboard/auto-apply", label: "Auto-apply", icon: "Zap" },
        { href: "/dashboard/import", label: "Import CV", icon: "Import" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/notifications", label: "Notifications", icon: "Bell", badge: unreadNotifications },
        { href: "/dashboard/connections", label: "Connections", icon: "UserPlus", badge: pendingConnectionsCount ?? 0 },
        { href: "/dashboard/subscription", label: "Subscription", icon: "CreditCard" },
        { href: "/dashboard/profile", label: "Profile & visibility", icon: "UserCog" },
      ],
    },
  ];

  const employerNavGroups: NavGroup[] = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
        { href: "/dashboard/jobs", label: "My job posts", icon: "Briefcase" },
        { href: "/dashboard/jobs/new", label: "Post a job", icon: "PlusSquare" },
        { href: "/jobs", label: "Public job board", icon: "Globe" },
      ],
    },
    {
      label: "Hiring",
      items: [
        { href: "/dashboard/interviews", label: "Interviews", icon: "CalendarClock" },
        { href: "/dashboard/candidates", label: "Candidate pool", icon: "Users" },
        { href: "/dashboard/induction", label: "Induction & onboarding", icon: "GraduationCap" },
        { href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/notifications", label: "Notifications", icon: "Bell", badge: unreadNotifications },
        { href: "/dashboard/connections", label: "Connections", icon: "UserPlus", badge: pendingConnectionsCount ?? 0 },
        { href: "/dashboard/subscription", label: "Subscription", icon: "CreditCard" },
      ],
    },
  ];

  const adminNavGroups: NavGroup[] = [
    {
      label: "Platform",
      items: [
        { href: "/dashboard/admin", label: "Platform overview", icon: "LayoutDashboard" },
        { href: "/dashboard/admin/users", label: "Users", icon: "Users" },
        { href: "/dashboard/admin/jobs", label: "Jobs", icon: "Briefcase" },
        { href: "/dashboard/admin/payments", label: "Payments", icon: "CreditCard" },
        { href: "/dashboard/admin/invoices", label: "Invoices", icon: "Receipt" },
        { href: "/dashboard/admin/blog", label: "Blog", icon: "Newspaper" },
      ],
    },
    // Admins also get full candidate access from the same account.
    ...candidateNavGroups,
  ];

  const navGroups =
    role === "admin" ? adminNavGroups : role === "employer" ? employerNavGroups : candidateNavGroups;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 md:flex-row">
      <SidebarShell>
        <SidebarPlanCard
          role={role}
          plan={profile?.plan}
          creditsRemaining={profile?.credits_remaining}
          jobPostingCredits={profile?.job_posting_credits}
        />
        <DashboardNav groups={navGroups} />
        <SidebarFooter
          name={profile?.full_name || user.email || "Account"}
          role={role}
          showWhatsApp={role === "candidate" || role === "admin"}
          avatarUrl={profile?.avatar_url}
        />
      </SidebarShell>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          name={profile?.full_name || user.email || "Account"}
          email={user.email || ""}
          role={role}
          creditsRemaining={role === "candidate" || role === "admin" ? (profile?.credits_remaining ?? 0) : null}
          notifications={notifications ?? []}
          avatarUrl={profile?.avatar_url}
        />
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
