import { Card } from "@/components/ui/card";

export type WeekBucket = {
  label: string;
  submitted: number;
  interviews: number;
};

export function WeeklyBarChart({ title, weeks }: { title: string; weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.submitted, w.interviews)));

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Submitted
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Interviews
          </span>
        </div>
      </div>
      <div className="flex h-40 items-end gap-3">
        {weeks.map((week) => (
          <div key={week.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 items-end gap-1">
              <div
                className="w-2.5 rounded-t bg-indigo-600"
                style={{ height: `${(week.submitted / max) * 100}%` }}
                title={`${week.submitted} submitted`}
              />
              <div
                className="w-2.5 rounded-t bg-amber-500"
                style={{ height: `${(week.interviews / max) * 100}%` }}
                title={`${week.interviews} interviews`}
              />
            </div>
            <span className="text-[10px] text-slate-400">{week.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
