"use client";

import { useState, useTransition } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shareJobWithConnection } from "@/lib/messages/actions";

export function ShareJobButton({
  jobId,
  connections,
}: {
  jobId: string;
  connections: { connectionId: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [connectionId, setConnectionId] = useState(connections[0]?.connectionId ?? "");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (connections.length === 0) return null;

  function send() {
    if (!connectionId) return;
    setError(null);
    startTransition(async () => {
      const res = await shareJobWithConnection(connectionId, jobId, note);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSent(true);
      setNote("");
    });
  }

  return (
    <div className="relative">
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        <Share2 className="mr-1.5 h-3.5 w-3.5" />
        Share
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close share panel"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
            <p className="mb-2 text-sm font-semibold text-slate-900">Share with a connection</p>
            {sent ? (
              <p className="text-sm text-emerald-600">Sent! View it in your connection&apos;s chat.</p>
            ) : (
              <>
                <select
                  value={connectionId}
                  onChange={(e) => setConnectionId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                >
                  {connections.map((c) => (
                    <option key={c.connectionId} value={c.connectionId}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm placeholder:text-slate-400"
                />
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                <Button type="button" size="sm" className="mt-2 w-full" onClick={send} disabled={isPending}>
                  {isPending ? "Sending…" : "Send"}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
