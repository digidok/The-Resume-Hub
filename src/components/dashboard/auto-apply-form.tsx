"use client";

import { useState, useTransition } from "react";
import { runAutoApply, saveAutoApplySettings } from "@/lib/autoapply/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import type { AutoApplySettings } from "@/types/database";

export function AutoApplyForm({
  resumes,
  initialSettings,
  suggestedKeywords = [],
}: {
  resumes: { id: string; title: string }[];
  initialSettings: AutoApplySettings | null;
  suggestedKeywords?: string[];
}) {
  const [resumeId, setResumeId] = useState(initialSettings?.resume_id ?? "");
  const [keywords, setKeywords] = useState(initialSettings?.keywords ?? "");
  const [location, setLocation] = useState(initialSettings?.location ?? "");
  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? false);
  const lastRunAt = initialSettings?.last_run_at ?? null;
  const [result, setResult] = useState<{ matched: number; applied: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function run() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await runAutoApply({ resumeId, keywords, location });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    });
  }

  function addKeyword(keyword: string) {
    const current = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (current.some((k) => k.toLowerCase() === keyword.toLowerCase())) return;
    setKeywords([...current, keyword].join(", "));
  }

  function saveSchedule(nextEnabled: boolean) {
    setScheduleError(null);
    setScheduleStatus(null);
    startSaving(async () => {
      const res = await saveAutoApplySettings({ resumeId, keywords, location, enabled: nextEnabled });
      if (res.error) {
        setScheduleError(res.error);
        return;
      }
      setEnabled(nextEnabled);
      setScheduleStatus(nextEnabled ? "Scheduled auto-apply is on." : "Scheduled auto-apply is off.");
    });
  }

  if (resumes.length === 0) {
    return <p className="text-sm text-slate-500">Create a resume first.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div>
          <Label htmlFor="resume">Apply with</Label>
          <Select id="resume" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
            <option value="">Select a resume</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="keywords">Keywords (comma-separated)</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="React, frontend, TypeScript"
          />
          {suggestedKeywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-400">From your Career Passport:</span>
              {suggestedKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => addKeyword(kw)}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                >
                  + {kw}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="location">Location contains (optional)</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <p className={`text-sm ${result.matched === 0 ? "text-slate-500" : "text-emerald-600"}`}>
            {result.matched === 0
              ? "No open jobs matched those keywords at 80%+ against your Career Passport — try broader keywords, clear the location filter, or fill in more of your Career Passport for better matching. No credit was used."
              : `Found ${result.matched} strong match${result.matched === 1 ? "" : "es"} (80%+ against your Career Passport), applied to ${result.applied}.`}
          </p>
        )}
        <Button onClick={run} disabled={isPending || !resumeId}>
          {isPending ? "Running…" : "Run auto-apply now (1 credit)"}
        </Button>
        {!resumeId && <p className="text-xs text-amber-600">Select a resume above to run auto-apply.</p>}
        <p className="text-xs text-slate-400">
          Only applies to open Resume Hub jobs that score 80%+ against your Career Passport — this
          does not apply on other job boards. You&apos;re only charged a credit when at least one job
          matches.
        </p>
      </Card>

      <Card className="space-y-3 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-slate-900">Scheduled auto-apply</p>
            <p className="text-sm text-slate-500">
              We&apos;ll check for new matching jobs every day and apply automatically — no
              credits used, and we&apos;ll email you when we do.
            </p>
            {enabled && (
              <p className="mt-1 text-xs font-medium text-brand-700">
                On {lastRunAt ? `· last ran ${new Date(lastRunAt).toLocaleString()}` : "· hasn't run yet"}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant={enabled ? "outline" : "primary"}
            size="sm"
            disabled={isSaving || (!enabled && !resumeId)}
            onClick={() => saveSchedule(!enabled)}
          >
            {enabled ? "Turn off" : "Turn on"}
          </Button>
        </div>
        {scheduleError && <p className="text-sm text-red-600">{scheduleError}</p>}
        {scheduleStatus && <p className="text-sm text-emerald-600">{scheduleStatus}</p>}
      </Card>
    </div>
  );
}
