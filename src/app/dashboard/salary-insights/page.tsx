"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

type SalaryEstimate = {
  currency: string;
  low: number;
  median: number;
  high: number;
  period: string;
  summary: string;
  factors: string[];
};

export default function SalaryInsightsPage() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SalaryEstimate | null>(null);

  async function estimate() {
    if (!role || !location) {
      setError("Enter a role and location.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/salary-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach the estimator.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Salary insights</h1>
      <p className="mb-6 text-sm text-slate-500">
        An AI-estimated salary range — a rough guide, not verified market data.
      </p>
      <Card className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Software Engineer" />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Cape Town, South Africa"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={estimate} disabled={loading}>
          {loading ? "Estimating…" : "Estimate salary (1 credit)"}
        </Button>

        {result && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-600">
                {result.currency} {result.median.toLocaleString()}
              </span>
              <span className="text-sm text-slate-500">median / {result.period}</span>
            </div>
            <p className="text-sm text-slate-600">
              Range: {result.currency} {result.low.toLocaleString()} – {result.high.toLocaleString()} per{" "}
              {result.period}
            </p>
            <p className="text-sm text-slate-700">{result.summary}</p>
            {result.factors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-900">What affects this</p>
                <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                  {result.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
