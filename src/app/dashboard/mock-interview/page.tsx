"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function MockInterviewPage() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(nextMessages: ChatMessage[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, company, messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Could not reach the interviewer.");
    } finally {
      setLoading(false);
    }
  }

  async function start() {
    if (!role) {
      setError("Enter a role to practice for.");
      return;
    }
    setStarted(true);
    setMessages([]);
    await send([]);
  }

  async function reply() {
    if (!draft.trim()) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: draft.trim() }];
    setMessages(next);
    setDraft("");
    await send(next);
  }

  function endInterview() {
    setStarted(false);
    setMessages([]);
    setDraft("");
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Mock interview</h1>
      <p className="mb-6 text-sm text-slate-500">Practice with an AI interviewer for a specific role.</p>

      {!started ? (
        <Card className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Product Manager" />
            </div>
            <div>
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={start} disabled={loading}>
            {loading ? "Starting…" : "Start interview (2 credits)"}
          </Button>
        </Card>
      ) : (
        <Card className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              Interviewing for {role}
              {company ? ` at ${company}` : ""}
            </p>
            <Button size="sm" variant="ghost" onClick={endInterview}>
              End
            </Button>
          </div>
          <div className="mb-4 flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-lg bg-slate-50 p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "assistant"
                    ? "self-start bg-white text-slate-800 shadow-sm"
                    : "self-end bg-brand-600 text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400">Interviewer is typing…</p>}
          </div>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  reply();
                }
              }}
              placeholder="Type your answer…"
              disabled={loading}
            />
            <Button onClick={reply} disabled={loading || !draft.trim()}>
              Send
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
