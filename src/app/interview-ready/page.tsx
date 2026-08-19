import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { InterviewQuizClient } from "@/components/interview-quiz/interview-quiz-client";

// Deliberately no SiteHeader/nav here — this is a single-purpose lead-magnet
// landing page (every ad/social link points straight at it), and nav
// distractions measurably hurt funnel completion rate.
export const metadata = {
  title: "Get Interview Ready — Resume Hub",
  description: "Answer 6 quick questions and get your free personal interview prep plan.",
};

export default function InterviewReadyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-100 bg-white px-4 py-4">
        <Link href="/" className="mx-auto block w-fit">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center px-4 py-10">
        <InterviewQuizClient />
      </main>
    </div>
  );
}
