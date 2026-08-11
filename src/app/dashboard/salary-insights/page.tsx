"use client";

import { useMemo, useState } from "react";
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

function buildDistribution(low: number, median: number, high: number) {
  const spread = Math.max(high - low, 1);
  const bucketWidth = spread / 5;
  const start = low - bucketWidth;
  const bucketCount = 7;

  return Array.from({ length: bucketCount }, (_, i) => {
    const bucketStart = start + i * bucketWidth;
    const bucketEnd = bucketStart + bucketWidth;
    const center = (bucketStart + bucketEnd) / 2;
    const distanceFromMedian = Math.abs(center - median);
    const height = Math.max(0.08, 1 - distanceFromMedian / (spread * 0.75));
    return { bucketStart, bucketEnd, height };
  });
}

export default function SalaryInsightsPage() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [target, setTarget] = useState("");
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

  const distribution = useMemo(
    () => (result ? buildDistribution(result.low, result.median, result.high) : []),
    [result]
  );
  const targetValue = target ? Number(target) : null;
  const vsMedianPct =
    result && targetValue ? Math.round(((targetValue - result.median) / result.median) * 100) : null;
  const targetBucketIndex =
    result && targetValue !== null
      ? distribution.findIndex((b) => targetValue >= b.bucketStart && targetValue < b.bucketEnd)
      : -1;
  const medianBucketIndex = result
    ? distribution.findIndex((b) => result.median >= b.bucketStart && result.median < b.bucketEnd)
    : -1;

  return (
    <div className="mx-auto max-w-2xl">
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
        <div>
          <Label htmlFor="target">Your target salary (optional)</Label>
          <Input
            id="target"
            type="number"
            min={0}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. 650000"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={estimate} disabled={loading}>
          {loading ? "Estimating…" : "Estimate salary (1 credit)"}
        </Button>

        {result && (
          <div className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-2xl font-bold text-brand-600">
                  {result.currency} {result.median.toLocaleString()}
                </span>
                <span className="ml-2 text-sm text-slate-500">median / {result.period}</span>
                <p className="text-sm text-slate-600">
                  Range: {result.currency} {result.low.toLocaleString()} – {result.high.toLocaleString()}{" "}
                  per {result.period}
                </p>
              </div>
              {targetValue !== null && vsMedianPct !== null && (
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900">
                    {result.currency} {targetValue.toLocaleString()}
                  </span>
                  <p className={`text-sm font-medium ${vsMedianPct >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {vsMedianPct >= 0 ? "+" : ""}
                    {vsMedianPct}% vs median
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Illustrative distribution
              </p>
              <div className="flex h-24 items-end gap-1.5">
                {distribution.map((bucket, i) => {
                  const isMedianBucket = i === medianBucketIndex;
                  const isTargetBucket = i === targetBucketIndex && targetBucketIndex !== medianBucketIndex;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      {isMedianBucket && (
                        <span className="text-[10px] font-medium text-brand-700">You</span>
                      )}
                      {isTargetBucket && (
                        <span className="text-[10px] font-medium text-accent-600">Target</span>
                      )}
                      <div
                        className={`w-full rounded-t ${
                          isMedianBucket
                            ? "bg-brand-600"
                            : isTargetBucket
                              ? "bg-accent-500"
                              : "bg-slate-200"
                        }`}
                        style={{ height: `${bucket.height * 4.5}rem` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Shape illustrates the estimated range, not real survey data.
              </p>
            </div>

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
