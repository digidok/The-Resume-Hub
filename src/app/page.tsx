import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    title: "Resume builder",
    description:
      "Build a polished resume with a live preview, multiple templates, and one-click PDF export.",
  },
  {
    title: "Shareable profile",
    description: "Publish a public link to your resume you can drop in any application or DM.",
  },
  {
    title: "Job board",
    description: "Browse open roles and apply directly with a resume from your Resume Hub library.",
  },
  {
    title: "AI resume review",
    description:
      "Get an ATS-style score and concrete feedback, optionally tailored to a specific job description.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Build your resume. Get discovered. Land the job.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Resume Hub is a free platform to build, share, and improve your resume — and apply to
            real jobs from employers using AI-assisted feedback along the way.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Create your resume</Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline">
                Browse jobs
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Resume Hub
      </footer>
    </div>
  );
}
