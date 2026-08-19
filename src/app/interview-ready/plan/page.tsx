import { PlanRevealClient } from "@/components/interview-quiz/plan-reveal-client";

export const metadata = {
  title: "Your interview prep plan — Resume Hub",
};

export default function InterviewReadyPlanPage() {
  return (
    <div className="flex min-h-screen items-center bg-slate-50 px-4 py-10">
      <PlanRevealClient />
    </div>
  );
}
