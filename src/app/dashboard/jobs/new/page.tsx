import Link from "next/link";
import { CreateJobForm } from "@/components/jobs/create-job-form";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/jobs" className="text-sm text-brand-600 hover:underline">
        ← My job posts
      </Link>
      <h1 className="mb-6 mt-1 text-3xl font-bold text-slate-900">Post a job</h1>
      <CreateJobForm />
    </div>
  );
}
