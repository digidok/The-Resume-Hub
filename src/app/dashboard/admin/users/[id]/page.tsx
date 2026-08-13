import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateUserProfile } from "@/lib/admin/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/field";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import type { ProfileRole, ProfilePlan } from "@/types/database";

const ROLE_OPTIONS: ProfileRole[] = ["candidate", "employer", "admin"];
const PLAN_OPTIONS: ProfilePlan[] = ["free", "pro"];

export default async function AdminUserDetailPage({
  params,
}: PageProps<"/dashboard/admin/users/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (viewerProfile?.role !== "admin") redirect("/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) notFound();

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);

  const [{ data: resumes }, { data: applications }, { data: coverLetters }, { data: savedJobs }, { data: careerProfile }, { data: payments }] =
    await Promise.all([
      supabase.from("resumes").select("id, title, is_public, updated_at").eq("user_id", id).order("updated_at", { ascending: false }),
      supabase
        .from("applications")
        .select("id, status, created_at, jobs(title, company)")
        .eq("candidate_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("cover_letters").select("id, title, updated_at").eq("user_id", id).order("updated_at", { ascending: false }),
      supabase.from("saved_jobs").select("id").eq("user_id", id),
      supabase.from("career_profiles").select("id").eq("user_id", id).maybeSingle(),
      supabase.from("payments").select("id, item_name, amount, status, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
    ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackLink href="/dashboard/admin/users" label="Users" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{profile.full_name || "Unnamed"}</h1>
          <p className="text-sm text-slate-500">
            {authUser?.user?.email ?? "No email"} · Joined{" "}
            {new Date(profile.created_at).toLocaleDateString()}
            {profile.source && profile.source !== "app" ? ` · via ${profile.source}` : ""}
          </p>
        </div>
        <DeleteUserButton userId={id} userName={profile.full_name || authUser?.user?.email || "this user"} />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Edit profile</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await updateUserProfile(id, {
              full_name: String(formData.get("full_name") ?? ""),
              phone_number: String(formData.get("phone_number") ?? ""),
              role: formData.get("role") as ProfileRole,
              plan: formData.get("plan") as ProfilePlan,
              credits_remaining: Number(formData.get("credits_remaining") ?? 0),
            });
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone number</Label>
            <Input id="phone_number" name="phone_number" defaultValue={profile.phone_number ?? ""} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue={profile.role}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="plan">Plan</Label>
            <Select id="plan" name="plan" defaultValue={profile.plan}>
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="credits_remaining">AI credits</Label>
            <Input
              id="credits_remaining"
              name="credits_remaining"
              type="number"
              min={0}
              defaultValue={profile.credits_remaining}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{resumes?.length ?? 0}</p>
          <p className="text-xs text-slate-500">Resumes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{applications?.length ?? 0}</p>
          <p className="text-xs text-slate-500">Applications</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{savedJobs?.length ?? 0}</p>
          <p className="text-xs text-slate-500">Saved jobs</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Resumes</h2>
        {resumes && resumes.length > 0 ? (
          <div className="space-y-2">
            {resumes.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="font-medium text-slate-900">{r.title || "Untitled"}</span>
                <span className="text-xs text-slate-400">
                  {r.is_public ? "Public" : "Private"} · Updated {new Date(r.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No resumes yet.</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent applications</h2>
        {applications && applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((a) => {
              const job = Array.isArray(a.jobs) ? a.jobs[0] : a.jobs;
              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-900">
                    {job?.title ?? "Unknown role"} {job?.company ? `· ${job.company}` : ""}
                  </span>
                  <span className="text-xs capitalize text-slate-400">{a.status}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No applications yet.</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Cover letters</h2>
        {coverLetters && coverLetters.length > 0 ? (
          <div className="space-y-2">
            {coverLetters.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="font-medium text-slate-900">{c.title || "Untitled"}</span>
                <span className="text-xs text-slate-400">Updated {new Date(c.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No cover letters yet.</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Career Passport</h2>
        <p className="text-sm text-slate-500">
          {careerProfile ? "This candidate has a Career Passport set up." : "No Career Passport yet."}
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Payment history</h2>
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="font-medium text-slate-900">{p.item_name}</span>
                <span className="text-xs text-slate-400">
                  R{Number(p.amount).toFixed(2)} · {p.status} · {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No payments yet.</p>
        )}
        <Link href="/dashboard/admin/payments" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          View all payments →
        </Link>
      </Card>
    </div>
  );
}
