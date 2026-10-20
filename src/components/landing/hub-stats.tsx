import { Briefcase, FileText, Layers } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { ALL_DIVISIONS } from "@/lib/catalog/divisions";
import { JOB_SEEKER_CVS } from "@/lib/site-constants";
import { getOpenJobCount } from "@/lib/site-stats";

export async function HubStats() {
  const openJobs = await getOpenJobCount();

  const stats = [
    openJobs != null && {
      icon: Briefcase,
      value: openJobs,
      suffix: "",
      label: "jobs currently advertised",
      note: "Live count, updated every time the board changes",
    },
    {
      icon: FileText,
      value: JOB_SEEKER_CVS,
      suffix: "+",
      label: "job-seeker CVs in our database",
      note: "Candidates we can match to your vacancies",
    },
    {
      icon: Layers,
      value: ALL_DIVISIONS.length,
      suffix: "",
      label: "service areas, one accountable contact",
      note: "Career and business solutions in one hub",
    },
  ].filter(Boolean) as { icon: typeof Briefcase; value: number; suffix: string; label: string; note: string }[];

  return (
    <section aria-label="The Resume Document Hub in numbers" className="relative -mt-8 pb-4">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-brand-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-400 via-accent-500 to-brand-500"
                />
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-accent-400 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                      <CountUp value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{s.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{s.note}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
