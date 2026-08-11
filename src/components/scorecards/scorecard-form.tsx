"use client";

import { useActionState } from "react";
import { saveScorecard, SCORECARD_CATEGORIES } from "@/lib/scorecards/actions";
import type { AuthActionState } from "@/lib/auth/actions";
import type { InterviewScorecard, ScorecardRecommendation } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

const CATEGORY_LABELS: Record<(typeof SCORECARD_CATEGORIES)[number], string> = {
  communication: "Communication",
  technical_skills: "Technical skills",
  culture_fit: "Culture fit",
  problem_solving: "Problem solving",
};

const RECOMMENDATION_OPTIONS: { value: ScorecardRecommendation; label: string }[] = [
  { value: "strong_yes", label: "Strong yes" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "strong_no", label: "Strong no" },
];

const initialState: AuthActionState = {};

export function ScorecardForm({
  jobId,
  applicationId,
  existing,
}: {
  jobId: string;
  applicationId: string;
  existing: InterviewScorecard | null;
}) {
  const boundAction = saveScorecard.bind(null, jobId, applicationId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <Card className="space-y-5 p-6">
      <form action={formAction} className="space-y-5">
        <div className="space-y-3">
          {SCORECARD_CATEGORIES.map((category) => (
            <div key={category}>
              <Label>{CATEGORY_LABELS[category]}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <label
                    key={score}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-sm has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-600 has-[:checked]:text-white"
                  >
                    <input
                      type="radio"
                      name={category}
                      value={score}
                      defaultChecked={existing?.ratings?.[category] === score}
                      className="sr-only"
                    />
                    {score}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <Label htmlFor="recommendation">Recommendation</Label>
          <Select id="recommendation" name="recommendation" defaultValue={existing?.recommendation ?? ""}>
            <option value="">Select…</option>
            {RECOMMENDATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={5} defaultValue={existing?.notes ?? ""} />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-600">{state.message}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save scorecard"}
        </Button>
      </form>
    </Card>
  );
}
