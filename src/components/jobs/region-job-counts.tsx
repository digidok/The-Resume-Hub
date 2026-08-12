import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

// Suburbs/areas folded into their metro's bucket so counts don't fragment
// across "Sandton", "Midrand", "City of Johannesburg Metropolitan
// Municipality", etc. — all real variants Adzuna's location.display_name
// returns for the same city.
const SA_METROS: { label: string; matches: string[] }[] = [
  { label: "Johannesburg", matches: ["johannesburg", "sandton", "midrand", "randburg", "roodepoort"] },
  { label: "Cape Town", matches: ["cape town"] },
  { label: "Durban", matches: ["durban", "ethekwini"] },
  { label: "Pretoria", matches: ["pretoria", "tshwane", "centurion"] },
  { label: "Port Elizabeth", matches: ["port elizabeth", "gqeberha", "nelson mandela bay"] },
  { label: "Bloemfontein", matches: ["bloemfontein"] },
  { label: "East London", matches: ["east london"] },
  { label: "Nelspruit", matches: ["nelspruit", "mbombela"] },
];

export async function RegionJobCounts() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("country, location")
    .eq("status", "open");

  const rows = jobs ?? [];

  const countryCounts = new Map<string, number>();
  for (const job of rows) {
    countryCounts.set(job.country, (countryCounts.get(job.country) ?? 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const saJobs = rows.filter((job) => job.country === "South Africa");
  const metroCounts = SA_METROS.map((metro) => ({
    label: metro.label,
    count: saJobs.filter((job) => {
      const location = job.location?.toLowerCase() ?? "";
      return metro.matches.some((needle) => location.includes(needle));
    }).length,
  })).filter((metro) => metro.count > 0);

  if (rows.length === 0) return null;

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Jobs by region
        </h2>
        <p className="text-xs text-slate-400">Live count of open roles on Resume Hub</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {topCountries.map(([name, count]) => (
          <Link
            key={name}
            href={`/jobs?country=${encodeURIComponent(name)}`}
            className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            {name} <span className="font-bold">{count}</span>
          </Link>
        ))}
      </div>

      {metroCounts.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-400">South Africa, by city</p>
          <div className="flex flex-wrap gap-2">
            {metroCounts.map((metro) => (
              <span
                key={metro.label}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {metro.label} <span className="font-semibold text-slate-900">{metro.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
