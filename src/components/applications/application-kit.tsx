"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { ApplyForm } from "@/components/jobs/apply-form";
import { ExternalApplyLink } from "@/components/jobs/external-apply-link";
import { AiGeneratorPanel } from "@/components/applications/ai-generator-panel";
import type { Job, JobMatch, RecruiterMessageChannel, ResumeContent } from "@/types/database";

type ResumeOption = { id: string; title: string; content: ResumeContent };

const CHANNEL_LABELS: Record<RecruiterMessageChannel, string> = {
  linkedin: "LinkedIn",
  email: "Email",
  whatsapp: "WhatsApp",
};

export function ApplicationKit({
  job,
  resumes,
  match,
  alreadyApplied,
  creditsRemaining,
}: {
  job: Job;
  resumes: ResumeOption[];
  match: JobMatch | null;
  alreadyApplied: boolean;
  creditsRemaining: number;
}) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");

  const [messages, setMessages] = useState<Record<RecruiterMessageChannel, string> | null>(null);
  const [messagesPending, setMessagesPending] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<RecruiterMessageChannel>("linkedin");
  const [copied, setCopied] = useState(false);

  async function generateMessages() {
    if (!resumeId) return;
    setMessagesPending(true);
    setMessagesError(null);
    try {
      const res = await fetch("/api/recruiter-message/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobId: job.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessagesError(data.error ?? "Could not generate messages.");
        return;
      }
      setMessages({ linkedin: data.linkedin, email: data.email, whatsapp: data.whatsapp });
    } catch {
      setMessagesError("Could not reach the AI service.");
    } finally {
      setMessagesPending(false);
    }
  }

  function copyActiveMessage() {
    if (!messages) return;
    navigator.clipboard.writeText(messages[activeChannel]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Application Kit</p>
        <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
        <p className="text-sm text-slate-500">{job.company}</p>
      </Card>

      <AiGeneratorPanel job={job} resumes={resumes} initialMatch={match} creditsRemaining={creditsRemaining} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {messages ? <Check className="h-4 w-4 text-emerald-600" /> : <Sparkles className="h-4 w-4 text-brand-600" />}
            Recruiter Message
          </h2>
          {!messages && (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Generate a LinkedIn note, email, and WhatsApp message to reach out about this role.
              </p>
              {resumes.length > 1 && (
                <div className="mt-3 max-w-xs">
                  <label className="mb-1 block text-xs font-medium text-slate-700">Based on resume</label>
                  <Select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={messagesPending || !resumeId}
                onClick={generateMessages}
              >
                {messagesPending ? "Generating…" : "Generate Recruiter Message"}
              </Button>
            </>
          )}
          {messages && (
            <div className="mt-3">
              <div className="flex gap-2">
                {(Object.keys(CHANNEL_LABELS) as RecruiterMessageChannel[]).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setActiveChannel(channel)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      activeChannel === channel
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {CHANNEL_LABELS[channel]}
                  </button>
                ))}
              </div>
              <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {messages[activeChannel]}
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={copyActiveMessage}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}
          {messagesError && <p className="mt-2 text-sm text-red-600">{messagesError}</p>}
        </Card>

        <Card className="p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Interview Preparation</h2>
          <p className="mt-2 text-sm text-slate-600">
            Practice for this specific role with Interview Coach.
          </p>
          <Link href={`/dashboard/mock-interview?role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`}>
            <Button type="button" variant="outline" size="sm" className="mt-3">
              Prepare for interview
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Apply for this role</h2>
        {job.application_url ? (
          <ExternalApplyLink url={job.application_url} source={job.source} />
        ) : (
          <ApplyForm jobId={job.id} resumes={resumes} alreadyApplied={alreadyApplied} />
        )}
      </Card>
    </div>
  );
}
