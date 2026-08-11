import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  Layers,
  Sparkles,
  FileText,
  Mail,
  ScanSearch,
  Bookmark,
  MessageSquare,
  Bell,
  DollarSign,
  Zap,
  Import,
  UserCog,
  Briefcase,
  PlusSquare,
  Globe,
  CalendarClock,
  Users,
  BarChart3,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  GraduationCap,
  Newspaper,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { DashboardNav, type NavGroup } from "@/components/dashboard/nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, full_name, plan, credits_remaining, job_posting_credits")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const role = profile?.role ?? "candidate";

  const candidateNavGroups: NavGroup[] = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/jobs", label: "Find jobs", icon: Search },
        { href: "/dashboard/applications", label: "Applications", icon: ClipboardList },
        { href: "/dashboard/bulk-apply", label: "Bulk apply", icon: Layers },
        { href: "/dashboard/ai-generator", label: "AI generator", icon: Sparkles },
      ],
    },
    {
      label: "Documents",
      items: [
        { href: "/dashboard/resumes", label: "Resumes", icon: FileText },
        { href: "/dashboard/cover-letters", label: "Cover letters", icon: Mail },
        { href: "/dashboard/ats-scanner", label: "ATS scanner", icon: ScanSearch },
        { href: "/dashboard/saved-jobs", label: "Saved jobs", icon: Bookmark },
      ],
    },
    {
      label: "Prep & tools",
      items: [
        { href: "/dashboard/mock-interview", label: "Mock interview", icon: MessageSquare },
        { href: "/dashboard/follow-ups", label: "Follow-ups", icon: Bell },
        { href: "/dashboard/salary-insights", label: "Salary insights", icon: DollarSign },
        { href: "/dashboard/auto-apply", label: "Auto-apply", icon: Zap },
        { href: "/dashboard/import", label: "LinkedIn → CV", icon: Import },
        { href: "/dashboard/profile", label: "Profile & visibility", icon: UserCog },
      ],
    },
  ];

  const employerNavGroups: NavGroup[] = [
    {
      label: "Main",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/jobs", label: "My job posts", icon: Briefcase },
        { href: "/dashboard/jobs/new", label: "Post a job", icon: PlusSquare },
        { href: "/jobs", label: "Public job board", icon: Globe },
      ],
    },
    {
      label: "Hiring",
      items: [
        { href: "/dashboard/interviews", label: "Interviews", icon: CalendarClock },
        { href: "/dashboard/candidates", label: "Candidate pool", icon: Users },
        { href: "/dashboard/induction", label: "Induction & onboarding", icon: GraduationCap },
        { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
  ];

  const adminNavGroups: NavGroup[] = [
    {
      label: "Platform",
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/admin/users", label: "Users", icon: Users },
        { href: "/dashboard/admin/jobs", label: "Jobs", icon: Briefcase },
        { href: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
        { href: "/dashboard/admin/blog", label: "Blog", icon: Newspaper },
      ],
    },
  ];

  const navGroups =
    role === "admin" ? adminNavGroups : role === "employer" ? employerNavGroups : candidateNavGroups;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r md:overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <NotificationBell notifications={notifications ?? []} />
        </div>
        <DashboardNav groups={navGroups} />
        <div className="mt-6 border-t border-slate-200 pt-4">
          {role === "candidate" && (
            <Link
              href="/dashboard/subscription"
              className="mb-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm"
            >
              <span className="font-medium capitalize text-brand-800">{profile?.plan ?? "free"} plan</span>
              <span className="text-brand-700">{profile?.credits_remaining ?? 0} credits</span>
            </Link>
          )}
          {role === "employer" && (
            <Link
              href="/dashboard/subscription"
              className="mb-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-brand-800">Billing</span>
              <span className="text-brand-700">{profile?.job_posting_credits ?? 0} job posts left</span>
            </Link>
          )}
          {role === "admin" && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-medium">Admin access</span>
            </div>
          )}
          {role === "candidate" && (
            <a
              href="https://wa.me/27693391915"
              target="_blank"
              rel="noreferrer"
              className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Need help? Chat on WhatsApp
            </a>
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
