import { BellRing, Mail } from "lucide-react";

const TRACKED_JOBS = [
  {
    title: "Senior Financial Analyst",
    company: "Northwind Labs",
    salary: "R95k – R130k",
    location: "Sandton, JHB",
    status: "Interviewing",
  },
  {
    title: "Product Designer",
    company: "Acme Robotics",
    salary: "R70k – R90k",
    location: "Cape Town, ZA",
    status: "Applied",
  },
  {
    title: "React Developer",
    company: "Globex Software",
    salary: "R55k – R75k",
    location: "Remote",
    status: "Applied",
  },
  {
    title: "Senior HR Manager",
    company: "ABC Mining",
    salary: "R110k – R140k",
    location: "Johannesburg",
    status: "Bookmarked",
  },
] as const;

const STATUS_STYLES: Record<string, string> = {
  Interviewing: "bg-brand-50 text-brand-700",
  Applied: "bg-slate-100 text-slate-600",
  Bookmarked: "bg-amber-50 text-amber-700",
};

const REMINDERS = [
  { note: "Send a thank-you note", context: "Northwind Labs · Senior Financial Analyst", due: "Due tomorrow" },
  { note: "Check in after interview", context: "Northwind Labs · Senior Financial Analyst", due: "Due in 3 days" },
];

export function JobTrackerTable() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {TRACKED_JOBS.map((job) => (
              <tr key={job.title} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.company}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{job.salary}</td>
                <td className="px-4 py-3 text-slate-600">{job.location}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[job.status]}`}
                  >
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white">
            <BellRing className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Follow-ups</p>
        </div>
        <div className="mt-4 space-y-3">
          {REMINDERS.map((reminder) => (
            <div key={reminder.note} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">{reminder.note}</p>
              <p className="text-xs text-slate-500">{reminder.context}</p>
              <p className="mt-1 text-xs font-semibold text-brand-700">{reminder.due}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand-700">
          <Mail className="h-3.5 w-3.5" />
          We remind you before each one is due
        </div>
      </div>
    </div>
  );
}
