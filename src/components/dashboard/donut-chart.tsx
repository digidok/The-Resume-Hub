import { Card } from "@/components/ui/card";

export type DonutSegment = {
  label: string;
  value: number;
  colorClass: string;
  colorHex: string;
};

export function DonutChart({ title, segments }: { title: string; segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulative = 0;
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = total > 0 ? (cumulative / total) * 360 : 0;
      cumulative += s.value;
      const end = total > 0 ? (cumulative / total) * 360 : 0;
      return `${s.colorHex} ${start}deg ${end}deg`;
    });

  const background =
    total > 0 ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(#e2e8f0 0deg 360deg)";

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="flex items-center gap-6">
        <div
          className="relative h-32 w-32 shrink-0 rounded-full"
          style={{ background }}
          role="img"
          aria-label={`${title}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
        >
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white">
            <span className="text-lg font-bold text-slate-900">{total}</span>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.colorClass}`} />
              <span className="text-slate-600">{s.label}</span>
              <span className="font-medium text-slate-900">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
