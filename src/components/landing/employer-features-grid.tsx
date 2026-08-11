import {
  PlusSquare,
  ClipboardList,
  Users,
  CalendarClock,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { ScrollStagger } from "@/components/motion/scroll-reveal";
import { MotionCard } from "@/components/motion/motion-card";

const EMPLOYER_FEATURES = [
  {
    icon: PlusSquare,
    title: "Post a Job",
    description: "Write a listing yourself, or let AI draft the description from your role and company.",
  },
  {
    icon: ClipboardList,
    title: "Applicant Tracking & Scorecards",
    description: "Review applicants against structured scorecards — consistent, comparable evaluations.",
  },
  {
    icon: Users,
    title: "Candidate Pool",
    description: "Browse candidates who've opted in to be discoverable, with real public resumes.",
  },
  {
    icon: CalendarClock,
    title: "Interview Scheduling & Notes",
    description: "Track upcoming and past interviews, with notes attached to each candidate.",
  },
  {
    icon: GraduationCap,
    title: "Induction & Onboarding",
    description: "Build a study module and quiz new hires complete after accepting an offer.",
  },
  {
    icon: BarChart3,
    title: "Hiring Analytics",
    description: "See applicant volume, time-to-hire, and pipeline health across every job post.",
  },
];

export function EmployerFeaturesGrid() {
  return (
    <div>
      <h3 className="text-center text-sm font-semibold uppercase tracking-wide text-accent-600">
        Employer tools
      </h3>
      <ScrollStagger className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {EMPLOYER_FEATURES.map((feature) => (
          <MotionCard key={feature.title}>
            <div className="flex items-start gap-3">
              <feature.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{feature.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
              </div>
            </div>
          </MotionCard>
        ))}
      </ScrollStagger>
    </div>
  );
}
