"use client";

import { useState } from "react";
import { Check, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { JobMatch } from "@/types/database";

function statusFor(score: number): "pass" | "partial" | "fail" {
  if (score >= 80) return "pass";
  if (score >= 50) return "partial";
  return "fail";
}

const FACTORS: { key: keyof JobMatch; label: string }[] = [
  { key: "experienceScore", label: "Experience" },
  { key: "skillsScore", label: "Skills" },
  { key: "qualificationScore", label: "Qualifications & certifications" },
  { key: "industryScore", label: "Industry" },
  { key: "locationScore", label: "Location" },
];

export function QualificationCheck({ match }: { match: JobMatch }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide" : "Am I Qualified?"}
      </Button>

      {open && (
        <Card className="mt-3 p-5">
          <div className="space-y-2">
            {FACTORS.map((factor) => {
              const score = match[factor.key] as number;
              const status = statusFor(score);
              return (
                <div key={factor.key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{factor.label}</span>
                  {status === "pass" && (
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <Check className="h-4 w-4" /> Yes
                    </span>
                  )}
                  {status === "partial" && (
                    <span className="flex items-center gap-1 font-medium text-amber-600">
                      <AlertTriangle className="h-4 w-4" /> Partial
                    </span>
                  )}
                  {status === "fail" && (
                    <span className="flex items-center gap-1 font-medium text-red-600">
                      <X className="h-4 w-4" /> Not yet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-sm font-semibold text-slate-900">{match.overallScore}% Eligible</p>
            <p className="mt-1 text-sm text-slate-600">{match.recommendation}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
