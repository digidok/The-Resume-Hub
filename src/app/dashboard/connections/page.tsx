import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ConnectionRowActions } from "@/components/connections/connection-row-actions";
import { ConnectButton } from "@/components/connections/connect-button";
import type { SuggestedConnection } from "@/types/database";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PersonCard({
  name,
  headline,
  avatarUrl,
  resumeSlug,
  action,
}: {
  name: string;
  headline?: string | null;
  avatarUrl?: string | null;
  resumeSlug?: string | null;
  action: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {initials(name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {resumeSlug ? (
          <Link
            href={`/r/${resumeSlug}`}
            target="_blank"
            rel="noreferrer"
            className="truncate font-semibold text-slate-900 hover:text-brand-700 hover:underline"
          >
            {name}
          </Link>
        ) : (
          <p className="truncate font-semibold text-slate-900">{name}</p>
        )}
        {headline && <p className="truncate text-sm text-slate-500">{headline}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </Card>
  );
}

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: connections }, { data: suggestions }] = await Promise.all([
    supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_suggested_connections", { p_limit: 6 }),
  ]);

  const rows = connections ?? [];
  const incoming = rows.filter((c) => c.status === "pending" && c.recipient_id === user.id);
  const sent = rows.filter((c) => c.status === "pending" && c.requester_id === user.id);
  const accepted = rows.filter((c) => c.status === "accepted");

  const counterpartIds = [
    ...new Set(
      rows.map((c) => (c.requester_id === user.id ? c.recipient_id : c.requester_id))
    ),
  ];

  const [{ data: profiles }, { data: resumes }] = await Promise.all([
    counterpartIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, headline, avatar_url")
          .in("id", counterpartIds)
      : Promise.resolve({ data: [] }),
    counterpartIds.length
      ? supabase
          .from("resumes")
          .select("user_id, slug, updated_at")
          .in("user_id", counterpartIds)
          .eq("is_public", true)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const resumeSlugByUser = new Map<string, string>();
  for (const resume of resumes ?? []) {
    if (!resumeSlugByUser.has(resume.user_id)) {
      resumeSlugByUser.set(resume.user_id, resume.slug);
    }
  }

  function counterpartId(c: { requester_id: string; recipient_id: string }) {
    return c.requester_id === user!.id ? c.recipient_id : c.requester_id;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/dashboard" label="Dashboard" />
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Connections</h1>
      <p className="mb-6 text-sm text-slate-500">
        Build your professional network with other candidates and recruiters on The Resume Hub.
      </p>

      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Requests ({incoming.length})
          </h2>
          <div className="space-y-3">
            {incoming.map((c) => {
              const person = profileById.get(counterpartId(c));
              return (
                <PersonCard
                  key={c.id}
                  name={person?.full_name || "Someone"}
                  headline={person?.headline}
                  avatarUrl={person?.avatar_url}
                  resumeSlug={resumeSlugByUser.get(counterpartId(c))}
                  action={<ConnectionRowActions connectionId={c.id} variant="incoming" />}
                />
              );
            })}
          </div>
        </section>
      )}

      {sent.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sent ({sent.length})
          </h2>
          <div className="space-y-3">
            {sent.map((c) => {
              const person = profileById.get(counterpartId(c));
              return (
                <PersonCard
                  key={c.id}
                  name={person?.full_name || "Someone"}
                  headline={person?.headline}
                  avatarUrl={person?.avatar_url}
                  resumeSlug={resumeSlugByUser.get(counterpartId(c))}
                  action={<ConnectionRowActions connectionId={c.id} variant="sent" />}
                />
              );
            })}
          </div>
        </section>
      )}

      {suggestions && suggestions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            People in your field
          </h2>
          <div className="space-y-3">
            {(suggestions as SuggestedConnection[]).map((person) => (
              <PersonCard
                key={person.id}
                name={person.full_name || "Someone"}
                headline={person.headline || person.industry}
                avatarUrl={person.avatar_url}
                action={<ConnectButton targetUserId={person.id} relation={{ status: "none" }} />}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your connections ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p>
              No connections yet. Connect with someone above, or visit a candidate&apos;s public
              profile to connect.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {accepted.map((c) => {
              const person = profileById.get(counterpartId(c));
              return (
                <PersonCard
                  key={c.id}
                  name={person?.full_name || "Someone"}
                  headline={person?.headline}
                  avatarUrl={person?.avatar_url}
                  resumeSlug={resumeSlugByUser.get(counterpartId(c))}
                  action={<ConnectionRowActions connectionId={c.id} variant="connected" />}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
