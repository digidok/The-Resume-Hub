import Link from "next/link";
import { Briefcase } from "lucide-react";
import { CreateJobForm } from "@/components/jobs/create-job-form";
import { Card } from "@/components/ui/card";

const TIPS = [
  "Be specific about the role title — candidates search and match on it directly.",
  "Add a hiring contact so candidates know who's reviewing their application.",
  "Use the AI: Write button next to Description if you're starting from a blank page.",
];

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard/jobs" className="text-sm text-brand-600 hover:underline">
        ← My job posts
      </Link>
      <h1 className="mb-6 mt-1 text-3xl font-bold text-slate-900">Post a job</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CreateJobForm />
        </div>
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-900">Tips for a strong listing</p>
          </div>
          <ul className="mt-3 space-y-2.5">
            {TIPS.map((tip) => (
              <li key={tip} className="text-sm text-slate-600">
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
