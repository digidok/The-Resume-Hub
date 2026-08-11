import Link from "next/link";
import { CreateJobForm } from "@/components/jobs/create-job-form";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/jobs" className="text-sm text-indigo-600 hover:underline">
        ← My job posts
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-semibold text-slate-900">Post a job</h1>
      <CreateJobForm />
    </div>
  );
}
