"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { sendMessage } from "@/lib/messages/actions";
import { Button } from "@/components/ui/button";
import type { Message } from "@/types/database";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MessageThread({
  connectionId,
  counterpartName,
  counterpartAvatarUrl,
  viewerId,
  messages,
  jobById,
}: {
  connectionId: string;
  counterpartName: string;
  counterpartAvatarUrl: string | null;
  viewerId: string;
  messages: Message[];
  jobById: Record<string, { id: string; title: string; company: string }>;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const res = await sendMessage(connectionId, text);
      if (res.error) {
        setError(res.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {counterpartAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={counterpartAvatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initials(counterpartName)}
          </span>
        )}
        <p className="font-semibold text-slate-900">{counterpartName}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            Say hello to {counterpartName.split(" ")[0]} — no messages yet.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === viewerId;
          const sharedJob = m.job_id ? jobById[m.job_id] : null;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                <p
                  className={`whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {m.body}
                </p>
                {sharedJob && (
                  <Link
                    href={`/jobs/${sharedJob.id}`}
                    className={`mt-1 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-slate-50 ${
                      mine ? "border-brand-200 text-brand-700" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    View {sharedJob.title} at {sharedJob.company}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form ref={formRef} onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-full border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
        />
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          Send
        </Button>
      </form>
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
